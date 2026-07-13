import Endpoint from "../models/Endpoint.js";

export async function getEndpoints(req, res, next) {
    try {
        const endpoints = await Endpoint.find().sort({ lastSeen: -1 });
        res.status(200).json({ success: true, data: endpoints });
    } catch (error) {
        next(error);
    }
}

export async function getEndpointById(req, res, next) {
    try {
        const endpoint = await Endpoint.findOne({ endpointId: req.params.endpointId });
        if (!endpoint) {
            const err = new Error("Endpoint not found");
            err.statusCode = 404;
            throw err;
        }
        res.status(200).json({ success: true, data: endpoint });
    } catch (error) {
        next(error);
    }
}