import {Animated, Easing} from 'react-native';

class dockSlider {
    constructor(pos1, posEnd) {
        this.duration = 600;
        this.value = new Animated.Value(1);
        this.continue = true;

        this.pos1 = pos1;
        this.posEnd = posEnd;

        this.setLocation = this.setLocation.bind(this);
        this.getValue = this.getValue.bind(this);
    }

    setLocation(location) {
        Animated.timing(this.value, {
            toValue: location,
            duration: this.duration,
            easing: Easing.bezier(0.13, .87, .5, .99),
            useNativeDriver: true,
        }).start();
    }

    getValue() {
        return this.value.interpolate({
            inputRange: [0, 2],
            outputRange: [this.pos1, this.posEnd],
        });
    }
}

export default dockSlider;