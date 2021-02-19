import React, { Component } from 'react';
import * as faceapi from 'face-api.js';
import axios from 'axios';

export class LoginBiometrico extends Component {
    
    constructor(props){
        super(props);
        // Este estado controlará si ya se tomó la foto
        this.state = {
            fotoCaptured : false            
        }
    }

    /**
     * Preparar la camara 
     */

    processDevices(devices) {
        devices.forEach(device => {   
            if(device.kind === 'videoinput'){
                this.setDevice(device);
            }            
        });
    }

    /**
     * Detener la camara
     */

    stopVideo(){
        const mediaStream = this.videoPlayer.srcObject;
        const tracks = mediaStream.getTracks();
        tracks[0].stop();
    }

    /**
     * Iniciar la camara 
     */
    
    async setDevice(device) {
        
        const { deviceId } = device;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { deviceId } });

        this.videoPlayer.srcObject = stream;
        
        // Agregar el eventListener
        this.videoPlayer.addEventListener('play', async() => { 
            try{
                // Verificar si ya se tomó la foto
                if(!this.state.fotoCaptured){                
                
                    // Crear de la camara el canvas de reconocimiento 
                    const canvas = faceapi.createCanvasFromMedia(this.videoPlayer);
                    canvas.className = ""
                    this.divContainer.appendChild(canvas);

                    const displaySize = { width: this.videoPlayer.width, height: this.videoPlayer.height };

                    faceapi.matchDimensions(canvas, displaySize);

                    var success = false;

                    // Si no se ha tomado la foto
                    while(!this.state.fotoCaptured && !success){

                        // Iniciar detección facial
                        const detections = await faceapi.detectSingleFace(this.videoPlayer, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();

                        // Si hay detecciones y no se ha tomado foto
                        if(detections && !this.state.fotoCaptured){
                           
                            // Dibujar el marco de la cara 
                            const resizedDetections = faceapi.resizeResults(detections, displaySize);
                            
                            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)  
                            faceapi.draw.drawDetections(canvas, resizedDetections);

                            // Guardar en un canvas el rostro capturado
                            var context = this.canvas2.getContext('2d');
                            context.drawImage(this.videoPlayer, 0, 0, 640, 480);

                            // Convertir a base64 el canvas
                            var image = this.canvas2.toDataURL();                        

                            // Ocultar la camara para mostrar la foto capturada
                            this.divVideo.style.display = 'none'; 

                            // Enviar la imagen                        
                            let res = await this.sendImage(image); 
                                
                            //Validar estado de la peticion
                            if(res.status === 200){
                                // Si la respuesta es exitosa apagar la camara, continuar con el login
                                success = true;
                                this.setState({fotoCaptured : true});
                                this.stopVideo();                                  
                            }
                            else{
                                // Habilitar de nuevo la camara si hubo error
                                alert("Ha ocurrido un error, intente nuevamente!");
                                this.divVideo.style.display = 'block';
                                // Limpiar el canvas
                                let context = this.canvas2.getContext('2d');
                                context.clearRect(0, 0, this.canvas2.width, this.canvas2.height);
                            }                     
                        }
                    } 
                }
            }
            catch(error){
                alert('No hay comunicacion con el servidor: \n'+error);
            } 
        });     
    }

    /**
     * Enviar la imagen a la API
     */

    sendImage(image){ 
        // Consumir la API por Axios
        return axios({
            method: 'post',
            url: 'http://localhost/LoginBiometrico/prueba.php',
            data: { 
                'imgBase64' : image
            },
            //withCredentials: true
        });
    }

    /**
     * Al montarse el componente iniciar los modelos de reocnocimiento y luego iniciar dispositivos
     */

    async componentDidMount() {
        const cameras = await navigator.mediaDevices.enumerateDevices();  

        Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
            faceapi.nets.faceExpressionNet.loadFromUri('./models')
        ]).then(this.processDevices(cameras));       
    }

    /**
     * Renderizar componente
     */   

    render() {
        return (
            <div className="divContainer" ref={ref => (this.divContainer = ref)}>
                <div ref={ref => (this.divVideo = ref)} style={{display:"block"}}>
                    <video ref={ref => (this.videoPlayer = ref)} autoPlay width="720" height="560" />
                </div>
                <canvas width="640" height="480" ref={ref => (this.canvas = ref)} />
                <canvas width="640" height="480" ref={ref => (this.canvas2 = ref)} />                
            </div>
        );
    }
}