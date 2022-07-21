import {Animated, Easing} from 'react-native';
import * as Haptics from 'expo-haptics';

class messageHoldAnimation {
    constructor() {
        // changing scale
        this.value = new Animated.Value(1);

        this.startHolding = this.startHolding.bind(this);
        this.stoppedHolding = this.stoppedHolding.bind(this);
        this.finishedHolding = this.finishedHolding.bind(this);
    }

    startHolding() {
        Animated.timing(this.value, {
            toValue: 0.9,
            duration: 100,
            easing: Easing.ease,
            useNativeDriver: true,
        }).start();
    }

    stoppedHolding() {
        Animated.timing(this.value, {
            toValue: 1,
            duration: 200,
            easing: Easing.ease,
            useNativeDriver: true,
        }).start();
    }

    finishedHolding() {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Animated.spring(this.value, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }

    getValue() {
        return this.value;
    }
}

export default messageHoldAnimation;