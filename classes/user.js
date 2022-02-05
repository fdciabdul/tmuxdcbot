const fs = require('fs');
const { Pool } = require('./pool.js');

module.exports = {

    User: class User {

        constructor(id, pools) {

            if (pools === undefined) {
                pools = [];
            }

            this.id = id;
            this.pools = pools;
        }

        hasPool(pool) {

            if (typeof pool === "string") {

                for (let i = 0; i < this.pools.length; i++) {

                    if (this.pools[i].name.toLowerCase() == pool.toLowerCase()) {
                        return true;
                    }
    
                }
    
                return false;

            } 
            
            else if (pool instanceof Pool) {

                for (let i = 0; i < this.pools.length; i++) {

                    if (this.pools[i].name.toLowerCase() == pool.name.toLowerCase()) {
                        return true;
                    }
    
                }

                return false;

            }

            return false;

        }

        getPool(name) {

            if (name == null) {
                return null;
            }
            
            for (let i = 0; i < this.pools.length; i++) {

                if (this.pools[i].name.toLowerCase() == name.toLowerCase()) {
                    return this.pools[i];
                }

            }

            return null;

        }

        getPoolNames() {

            const names = [];

            for (let i = 0; i < this.pools.length; i++) {
                names.push(this.pools[i].name);
            }

            return names;

        }

        getPoolNameFromArgs(args) {

            const tmp = [...args];
            const names = this.getPoolNames();
            const n = tmp.length;
            let currentName = '';
            
            for (let i = 0; i < n; i++) {
                
                if (i > 0) {
                    currentName = currentName + ' ';
                }

                currentName = currentName + tmp.shift().toLowerCase();

                if (names.includes(currentName)) {
                    return currentName;
                }

            }

            return null;

        }

        addPool(pool) {

            if (typeof pool === "string") {

                if (this.hasPool(pool)) {
                    return;
                }
    
                this.pools.push(new Pool(pool));

            }

            else if (pool instanceof Pool) {

                if (this.hasPool(pool.name)) {
                    return;
                }

                this.pools.push(pool);

            }

        }

        removePool(name) {
            
            for (let i = 0; i < this.pools.length; i++) {

                if (this.pools[i].name == name) {
                    this.pools.splice(i, 1);
                    return;
                }

            }

        }

        save() {
            fs.writeFileSync('./data/' + this.id + '.json', this.stringify());
        }

        stringify() {
            return JSON.stringify(this, null, 2);
        }

        static load(id) {

            const userFiles = fs.readdirSync('./data').filter(file => file.endsWith('.json'));
            for (let file of userFiles) {
                
                if (file == id + '.json') {
        
                    try {
                        return User.parse(fs.readFileSync('./data/' + file, 'utf8'));
                    }
                    
                    catch (err) {
                        console.log(err);
                        continue;
                    }
        
                }
                
            }
            const newUser = new User(id);
            newUser.save();
            return newUser;

        }

        static parse(str) {

            const json = JSON.parse(str);

            const newPools = [];
            for (let i = 0; i < json.pools.length; i++) {
                newPools.push(Pool.parse(JSON.stringify(json.pools[i])));
            }

            return new User(json.id, newPools);
        }

    }

}