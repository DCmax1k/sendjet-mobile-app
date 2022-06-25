import { Animated, Easing } from "react-native";

class keyboardShift {
    constructor() {
        this.value = new Animated.Value(0);

        this.start = this.start.bind(this);
        this.end = this.end.bind(this);
    }

    start(dist) {
        Animated.timing(this.value, {
            toValue: -dist,
            duration: 300,
            easing: Easing.linear,
            useNativeDriver: false,
        }).start();
    }

    end() {
        Animated.timing(this.value, {
            toValue: 0,
            duration: 300,
            easing: Easing.linear,
            useNativeDriver: false,
        }).start();
    }

    getValue() {
        return this.value;
    }
}

export default keyboardShift;