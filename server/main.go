package main

import (
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/zgwit/iot-master/v4/log"
	"github.com/zgwit/webrtc-streamer/signaling"
)

var upper = &websocket.Upgrader{
	//HandshakeTimeout: time.Second,
	ReadBufferSize:  512,
	WriteBufferSize: 512,
	Subprotocols:    []string{"webrtc"},
	CheckOrigin:     func(r *http.Request) bool { return true },
}

var server signaling.Server

func main() {
	app := gin.Default()
	app.Use(cors.Default())

	app.GET("streamer/:id", func(ctx *gin.Context) {
		ws, err := upper.Upgrade(ctx.Writer, ctx.Request, nil)
		if err != nil {
			log.Error(err)
			return
		}

		//注册
		server.ConnectStreamer(ctx.Param("id"), ws)
	})

	app.GET("streamer/:id/connect", func(ctx *gin.Context) {
		ws, err := upper.Upgrade(ctx.Writer, ctx.Request, nil)
		if err != nil {
			log.Error(err)
			return
		}

		server.ConnectViewer(ctx.Param("id"), ws)
	})

	// err := app.RunTLS(":8080", "E:/Web_Code/webrtc-streamer-main/ca/certificate.crt", "E:/Web_Code/webrtc-streamer-main/ca/private.key")
	err := app.Run(":8080")
	if err != nil {
		log.Error(err)
		return
	}
}
