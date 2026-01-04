export function generateUUID() {
    return crypto.randomUUID();
}

class HttpError extends Error {
    constructor(message, response) {
        super(message)
        this.name = "HttpError"
        this.response = response
        Error.captureStackTrace(this, this.constructor)
    }
}

export async function makeRequest(fullUrl, method, headers, body) {
    method = method.toUpperCase()

    let config = {
        method: method,
        headers: headers,
    }

    if (["POST", "PUT"].includes(method)) {
        config.body = body
    }

    try {
        let response = await fetch(fullUrl, config)
        if (!response.ok) {
            let error = new HttpError(`HTTP Error status: ${response.status} - ${response.statusText}`, response)
            throw error
        }

        let contentType = response.headers.get("Content-Type")
        if (contentType && contentType.includes("application/json")) {
            return await response.json()
        }
        else {
            return await response.text()
        }
    }
    catch (error) {
        throw error
    }
}
