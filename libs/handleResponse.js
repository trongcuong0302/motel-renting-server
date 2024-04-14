async function handleResponse(req, res, func) {
    try {
        let data = await func(req);
        res.status(200).json(data);
    } catch (error) {
        if (error.code) {
            res.status(error.code).json({ message: error.message });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = handleResponse;