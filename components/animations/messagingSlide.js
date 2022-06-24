import {Animated} from 'react-native';

class messagingSlide {
    constructor(start, end, duration) {
        this.duration = duration;
        this.start = start;
        this.end = end;

        this.value = new Animated.Value(start);

        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.getValue = this.getValue.bind(this);
    }

    open() {
        Animated.timing(this.value, {
            toValue: this.end,
            duration: this.duration,
            useNativeDriver: false,
        }).start();
    }

    close() {
        Animated.timing(this.value, {
            toValue: this.start,
            duration: this.duration,
            useNativeDriver: false,
        }).start();
    }

    getValue() {
        return this.value;
    }
}

export default messagingSlide;