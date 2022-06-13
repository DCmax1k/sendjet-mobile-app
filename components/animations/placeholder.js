import {Animated, Easing} from 'react-native';

class placeholderAnimation {
    constructor(fontSize, bottom) {
        this.fontSize = fontSize;
        this.bottom = bottom;

        this.value = new Animated.Value(0);

        this.moveUp = this.moveUp.bind(this);
        this.moveDown = this.moveDown.bind(this);
        this.getFontSize = this.getFontSize.bind(this);
        this.getBottom = this.getBottom.bind(this);
    }

    moveUp() {
        Animated.timing(this.value, {
            toValue: 1,
            duration: 300,
            easing: Easing.bezier(0.13, .87, .5, .99),
            useNativeDriver: false,
        }).start();
    }

    moveDown() {
        Animated.timing(this.value, {
            toValue: 0,
            duration: this.duration,
            easing: Easing.bezier(0.13, .87, .5, .99),
            useNativeDriver: false,
        }).start();
    }

    getFontSize() {
        return this.value.interpolate({
            inputRange: [0, 1],
            outputRange: [this.fontSize, this.fontSize - 10],
        });
    }

    getBottom() {
        return this.value.interpolate({
            inputRange: [0, 1],
            outputRange: [-15, -33],
        });
    }

}

export default placeholderAnimation;