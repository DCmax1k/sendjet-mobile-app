import React, {useState, useEffect} from 'react';
import { StyleSheet, Text, View, Animated, Image, SafeAreaView, Pressable, TextInput, Button, Dimensions } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faLock } from '@fortawesome/free-solid-svg-icons'

import fadeIn from './animations/fadeIn';
import loginSlide from './animations/loginSlide';
import placeholderAnimation from './animations/placeholder';
import keyboardShift from './animations/keyboardShift';
import sendData from './sendData';

class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            page: 'signup',
        }
        this.animation = new fadeIn(500);
        this.animation.continue = false;
        this.animation.start();

        this.switchPage = this.switchPage.bind(this);
    }

    switchPage(page) {
        this.setState({ page });
    }

    componentDidMount() {

    }

    render() {
        return (
            <Animated.View style={[{opacity: this.animation.value}, {height: '100%', width: '100%'}]}>
                <SafeAreaView>

                    <View style={styles.title}>
                        <Image source={require('../assets/title.png')} style={styles.titleImg} />
                    </View>

                    <View style={styles.buttons}>
                        <Pressable onPress={() => this.switchPage('signup')} style={[styles.button, this.state.page === 'signup' && styles.activeButton]}>
                            <Text style={[styles.buttonText, this.state.page === 'signup' && styles.activeText]}>Sign up</Text>
                        </Pressable>
                        <Pressable onPress={() => this.switchPage('login')} style={[styles.button, this.state.page === 'login' && styles.activeButton]}>
                            <Text style={[styles.buttonText, this.state.page === 'login' && styles.activeText]}>Log in</Text>
                        </Pressable>
                    </View>

                    {this.state.page === 'signup' && <SignupInputs setPage={this.props.setPage} />}
                    {this.state.page === 'login' && <LoginInputs setPage={this.props.setPage} />}

                    {this.state.page === 'signup' && (
                    <View style={{flexDirection: 'row', borderBottomColor: '#a4a4a4', borderBottomWidth: 1, padding: 20, justifyContent: 'center', marginLeft: 40, marginRight: 40}}>
                        <Pressable onPress={() => this.switchPage('login')}>
                            <Text style={{fontSize: 17, color: '#a4a4a4'}}>Already have an account? Log in</Text>
                        </Pressable>
                    </View>
                    )}
                    {this.state.page === 'login' && (
                    <View style={{flexDirection: 'row', borderBottomColor: '#a4a4a4', borderBottomWidth: 1, padding: 20, justifyContent: 'center', marginLeft: 40, marginRight: 40}}>
                            <Pressable style={{flexDirection: 'row', alignItems: 'center'}} onPress={() => this.props.setPage('forgotPassword')}>
                                <FontAwesomeIcon color='#a4a4a4' icon={faLock} />
                                <Text style={{fontSize: 17, color: '#a4a4a4'}}> Forgot password?</Text>
                            </Pressable>
                    </View>
                    )}

                </SafeAreaView>
            </Animated.View>
        )
    }
}

function SignupInputs({setPage}) {

    const [animation, setAnimation] = useState(new loginSlide(500, -Dimensions.get('window').width));

    const firstNameAnima = new placeholderAnimation(25, -15);
    const lastNameAnima = new placeholderAnimation(25, -15 );
    const emailAnima = new placeholderAnimation(25, -15 );
    const usernameAnima = new placeholderAnimation(25, -15 );
    const passwordAnima = new placeholderAnimation(25, -15 );
    const confirmPasswordAnima = new placeholderAnimation(25, -15 );
    const [firstNameAnim, setFirstNameAnim] = useState(firstNameAnima);
    const [lastNameAnim, setLastNameAnim] = useState(lastNameAnima);
    const [emailAnim, setEmailAnim] = useState(emailAnima);
    const [usernameAnim, setUsernameAnim] = useState(usernameAnima);
    const [passwordAnim, setPasswordAnim] = useState(passwordAnima);
    const [confirmPasswordAnim, setConfirmPasswordAnim] = useState(confirmPasswordAnima);

    const [keyboardAnimation, setKeyboardAnimation] = useState(new keyboardShift());

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [submitText, setSubmitText] = useState('Create Account!');

    const changeFirstname = (e) => {
        e.nativeEvent.text ? firstNameAnim.moveUp() : firstNameAnim.moveDown();
        setFirstName(e.nativeEvent.text);
    }
    const changeLastname = (e) => {
        e.nativeEvent.text ? lastNameAnim.moveUp() : lastNameAnim.moveDown();
        setLastName(e.nativeEvent.text);
    }
    const changeEmail = (e) => {
        e.nativeEvent.text ? emailAnim.moveUp() : emailAnim.moveDown();
        setEmail(e.nativeEvent.text);
    }
    const changeUsername = (e) => {
        e.nativeEvent.text ? usernameAnim.moveUp() : usernameAnim.moveDown();
        setUsername(e.nativeEvent.text);
    }
    const changePassword = (e) => {
        e.nativeEvent.text ? passwordAnim.moveUp() : passwordAnim.moveDown();
        setPassword(e.nativeEvent.text);
    }
    const changeConfirmPassword = (e) => {
        e.nativeEvent.text ? confirmPasswordAnim.moveUp() : confirmPasswordAnim.moveDown();
        setConfirmPassword(e.nativeEvent.text);
    }

    const slidePage = (page) => {
        page === 1 ? animation.slideRight() : animation.slideLeft();
    }

    const createAccount = async () => {
        if (!firstName || !lastName || !email || !username || !password || !confirmPassword) return alert('Please fill in all fields!');
        if (password !== confirmPassword) return alert('Passwords do not match!');
        const userData = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            username: username,
            password: password,
        }
        setSubmitText('Loading...')
        const response = await sendData('/signup', userData);
        console.log(response);
        setSubmitText('Create Account!');
        if (response.status !== 'success') return alert(response.status);
        setPage('connecting');
    }

    return (
        <View style={[styles.signupInputsCont]}>
            <Animated.View style={[styles.inputsSliderCont, {transform: [{translateX: animation.getValue()}, {translateY: keyboardAnimation.value}]}]}>

                <View style={[styles.page]}>
                    <View style={styles.inputCont}>
                        <Animated.Text style={[styles.placeholder, {fontSize: firstNameAnim.getFontSize(), transform: [{translateY: firstNameAnim.getBottom()}]}]}>First name</Animated.Text>
                        <TextInput style={styles.input} onChange={changeFirstname} value={firstName} />
                    </View>
                    <View style={styles.inputCont}>
                        <Animated.Text style={[styles.placeholder, {fontSize: lastNameAnim.getFontSize(), transform: [{translateY: lastNameAnim.getBottom()}]}]}>Last name</Animated.Text>
                        <TextInput style={styles.input} onFocus={() => keyboardAnimation.start(80)} onEndEditing={() => keyboardAnimation.end()} onChange={changeLastname} value={lastName} />
                    </View>
                    <View style={styles.inputCont}>
                        <Animated.Text style={[styles.placeholder, {fontSize: emailAnim.getFontSize(), transform: [{translateY: emailAnim.getBottom()}]}]}>Email</Animated.Text>
                        <TextInput style={styles.input} onFocus={() => keyboardAnimation.start(120)} onEndEditing={() => keyboardAnimation.end()} onChange={changeEmail} value={email} />
                    </View>
                    <View style={styles.nextBtnCont}>
                        <Pressable style={styles.nextButton} onPress={() => slidePage(2)}>
                            <Text style={{color: 'white', fontSize: 20}}>Next Page</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.page}>
                    <View style={styles.inputCont}>
                        <Animated.Text style={[styles.placeholder, {fontSize: usernameAnim.getFontSize(), transform: [{translateY: usernameAnim.getBottom()}]}]}>Username</Animated.Text>
                        <TextInput style={styles.input} onChange={changeUsername} value={username} />
                    </View>
                    <View style={styles.inputCont}>
                        <Animated.Text style={[styles.placeholder, {fontSize: passwordAnim.getFontSize(), transform: [{translateY: passwordAnim.getBottom()}]}]}>Password</Animated.Text>
                        <TextInput secureTextEntry={true} style={styles.input} onFocus={() => keyboardAnimation.start(80)} onEndEditing={() => keyboardAnimation.end()} onChange={changePassword} value={password} />
                    </View>
                    <View style={styles.inputCont}>
                        <Animated.Text style={[styles.placeholder, {fontSize: confirmPasswordAnim.getFontSize(), transform: [{translateY: confirmPasswordAnim.getBottom()}]}]}>Confirm password</Animated.Text>
                        <TextInput secureTextEntry={true} style={styles.input} onFocus={() => keyboardAnimation.start(120)} onEndEditing={() => keyboardAnimation.end()} onChange={changeConfirmPassword} value={confirmPassword} />
                    </View>
                    <View style={[styles.nextBtnCont, {justifyContent: 'space-between'}]}>
                        <Pressable style={[styles.nextButton, {width: '30%'}]} onPress={() => slidePage(1)}>
                            <Text style={{color: 'white', fontSize: 20}}>Back</Text>
                        </Pressable>
                        <Pressable style={styles.nextButton} onPress={createAccount}>
                            <Text style={{color: 'white', fontSize: 20}}>{submitText}</Text>
                        </Pressable>
                    </View>
                </View>
            </Animated.View>
            
        </View>
    )
}

function LoginInputs({setPage}) {
    
    const usernameAnima = new placeholderAnimation(25, -15 );
    const passwordAnima = new placeholderAnimation(25, -15 );
    
    const [usernameAnim, setUsernameAnim] = useState(usernameAnima);
    const [passwordAnim, setPasswordAnim] = useState(passwordAnima);
    
    const [keyboardAnimation, setKeyboardAnimation] = useState(new keyboardShift());

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [submitText, setSubmitText] = useState('Login');

    const changeUsername = (e) => {
        e.nativeEvent.text ? usernameAnim.moveUp() : usernameAnim.moveDown();
        setUsername(e.nativeEvent.text);
    }
    const changePassword = (e) => {
        e.nativeEvent.text ? passwordAnim.moveUp() : passwordAnim.moveDown();
        setPassword(e.nativeEvent.text);
    }

    const submit = async () => {
        if (!username || !password) return;
        const userData = {
            username: username,
            password: password,
        }
        setSubmitText('Loading...')
        const response = await sendData('/login', userData);
        setSubmitText('Login');
        if (response.status !== 'success') return alert(response.status);
        setPage('connecting');
    }

    return (
        <View style={[styles.signupInputsCont]}>
            <Animated.View style={[styles.inputsSliderCont, {transform: [{translateY: keyboardAnimation.value}]}, {height: 267}]}>
                <View style={[styles.page]}>
                    <View style={styles.inputCont}>
                        <Animated.Text style={[styles.placeholder, {fontSize: usernameAnim.getFontSize(), transform: [{translateY: usernameAnim.getBottom()}]}]}>Username</Animated.Text>
                        <TextInput style={styles.input} onChange={changeUsername} value={username} />
                    </View>
                    <View style={styles.inputCont}>
                        <Animated.Text style={[styles.placeholder, {fontSize: passwordAnim.getFontSize(), transform: [{translateY: passwordAnim.getBottom()}]}]}>Password</Animated.Text>
                        <TextInput secureTextEntry={true} style={styles.input} onFocus={() => keyboardAnimation.start(80)} onEndEditing={() => keyboardAnimation.end()} onChange={changePassword} value={password} />
                    </View>
                    <View style={styles.nextBtnCont}>
                        <Pressable style={styles.nextButton} onPress={submit}>
                            <Text style={{color: 'white', fontSize: 20}}>{submitText}</Text>
                        </Pressable>
                    </View>
                </View>
            </Animated.View>
            
        </View>
    )
}

const styles = StyleSheet.create({
    title: {
        width: '100%',
        paddingLeft: 30,
        paddingRight: 30,
        
    },
    titleImg: {
        width: '100%',
        height: 150,
        resizeMode: 'contain',
    },
    buttons: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        width: '40%',
        height: 80,
        borderBottomWidth: 1,
        borderBottomColor: '#a4a4a4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeButton: {
        borderBottomColor: '#fff',
    },
    buttonText: {
        fontSize: 30,
        color: '#a4a4a4',
    },
    activeText: {
        color: '#fff',
    },
    signupInputsCont: {
        width: '100%',
        height: 370,
        flexDirection: 'column',
        justifyContent: 'center',
        marginTop: 50,
        overflow: 'hidden',
    },
    inputsSliderCont: {
        width: '200%',
        height: '100%',
        flexDirection: 'row',
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden',
    },
    page: {
        width: '50%',
        height: '100%',
        paddingRight: 20,
        paddingLeft: 20,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 10,
    },
    inputCont: {
        width: '100%',
        height: 80,
        backgroundColor: 'rgba(255,205,169,0.24)',
        borderRadius: 10,
        paddingLeft: 20,
    },
    input: {
        width: '100%',
        height: '100%',
        fontSize: 20,
        color: '#d7d7d7',

    },
    nextBtnCont: {
        width: '100%',
        height: 50,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        
    },
    nextButton: {
        width: '55%',
        height: '100%',
        backgroundColor: '#af282c',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: 'black',
        shadowOffset: {width: 3, height: 3},
        shadowOpacity: 0.5,
        shadowRadius: 3,
    },
    placeholder: {
        //fontSize: 25, // animation
        color: '#a4a4a4',
        position: 'absolute',
        top: '50%',
        left: 20,
        //transform: [{translateY: -15}], //animation
    },

});

export default Login;