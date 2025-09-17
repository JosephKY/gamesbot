function getGuild(client, id){
    return new Promise(async (resolve, reject) => {
        try {
            let cache = client.guilds.cache.get(id);
            if(cache){
                return resolve(cache);
            }

            let fetch = await client.guilds.fetch({
                'guild': id
            })
            return resolve(fetch)
        } catch (e) {
            reject(e)
        }
    });
}

module.exports = getGuild