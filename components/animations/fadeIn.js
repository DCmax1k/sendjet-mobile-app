import {Animated} from 'react-native';

class fadeIn {
    constructor(duration) {
        this.duration = duration;
        this.value = new Animated.Value(0);
        this.continue = true;

        this.start = this.start.bind(this);
        this.finish = this.finish.bind(this);
    }

    start() {
        Animated.timing(this.value, {
            toValue: 1,
            duration: this.duration,
            useNativeDriver: true,
        }).start(() => {
            setTimeout(() => {
                this.continue && this.finish();
            }, 500);
        });
    }

    finish() {
        Animated.timing(this.value, {
            toValue: 0,
            duration: this.duration,
            useNativeDriver: true,
        }).start(() => {
            this.continue && this.start();
        });
    }
}

export default fadeIn;