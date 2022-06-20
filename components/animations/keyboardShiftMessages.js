import { Animated, Easing, Platform } from "react-native";

class keyboardShiftMessages {
    constructor(beg, finish, duration) {

        this.beg = beg;
        this.finish = finish;
        this.duration = duration;

        this.value = new Animated.Value(0);

        this.start = this.start.bind(this);
        this.end = this.end.bind(this);
        this.getValue = this.getValue.bind(this);
    }

    start() {
        Animated.spring(this.value, {
            toValue: Platform.OS === 'android'?0:this.finish,
            useNativeDriver: false,
        }).start();
    }

    end() {
        Animated.spring(this.value, {
            toValue: Platform.OS === 'android'?0:this.beg,
            useNativeDriver: false,
        }).start();
    }

    getValue() {
        return this.value;
    }
}

export default keyboardShiftMessages;