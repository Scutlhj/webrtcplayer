let stream = new MediaStream()
let pc = new RTCPeerConnection({
    iceServers: [
        {
            urls: "stun:39.108.248.96:3478",
        },
        {
            urls: "turn:39.108.248.96:3478",
            username: "linhaojun",
            credential: "Lhj020517",
        },
    ]
})

let ws = new WebSocket("ws://rich-nationally-emu.ngrok-free.app/streamer/test/connect")
let id

function send(type, data) {
    console.log('[SEND] ===>', type, data)

    if (typeof data === "object") {
        data = JSON.stringify(data)
    }
    let text = JSON.stringify({ id, type, data })
    ws.send(text)
}

ws.onerror = console.error

ws.onopen = function (event) {
    console.log("websocket onopen")
    send("connect", { url: "rtsp://admin:admin1@192.168.110.34/stream2" })
}

ws.onmessage = async function (event) {
    //console.log("<---", event.data)
    let msg = JSON.parse(event.data)
    console.log('[RECV] <===', msg.type, msg.data)

    id = msg.id
    switch (msg.type) {
        case "offer":
            await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: msg.data }))
            let answer = await pc.createAnswer()
            send("answer", answer.sdp)
            await pc.setLocalDescription(answer)
            break
        case "answer":
            await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: msg.data }))
            break
        case "candidate":
            if (msg.data)
                await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(msg.data)))
            break
        case "error":
            console.error("streamer error", msg.data)
            break
    }
}

pc.onnegotiationneeded = async function () {
    console.log("onnegotiationneeded")

    // let offer = await pc.createOffer()
    // await pc.setLocalDescription(offer)
    // send("offer", offer.sdp)
};

pc.ontrack = function (event) {
    console.log("ontrack", event.streams)

    stream.addTrack(event.track);
    let videoElem = document.getElementById("video")
    videoElem.srcObject = stream;
}

pc.onicecandidate = function (event) {
    console.log("candidate", event.candidate)
    if (event.candidate)
        send("candidate", event.candidate.toJSON())
}

pc.oniceconnectionstatechange = function (event) {
    console.log("oniceconnectionstatechange", pc.iceConnectionState)
}

pc.addTransceiver("video", { 'direction': 'sendrecv' })

