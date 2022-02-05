module.exports = {

    titleCase(str) {

        var splitStr = str.toLowerCase().split(' ');
        for (var i = 0; i < splitStr.length; i++) {
            splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
        }

        return splitStr.join(' '); 
        
    },

    getRandomInt(min, max) {
        
        min = Math.ceil(min);
        max = Math.floor(max);

        var random = Math.floor(Math.random() * (max - min + 1)) + min;
        console.log(`[${min},${max}] -> ${random}`);
        return random;

    },

    shuffle(array) {

        let currentIndex = array.length,  randomIndex;
      
        while (currentIndex != 0) {
      
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];

        }
      
        return array;
    }

}