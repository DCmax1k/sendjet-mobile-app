import React from 'react';
import { View, Text } from 'react-native';

export default function FormatUsername({user, size}) {
    if (user) {
      return (
                <View style={{flexDirection: 'row'}}>
                    { user.premium && user.prefix.title? (<Text style={{fontSize: size, color: user.prefix.color, fontWeight: 'bold', marginRight: 5,}}>[{user.prefix.title}]</Text>):null}
                    <Text style={{fontSize: size, color: user.premium && user.usernameColor?user.usernameColor:'#fff'}}>{user.username}</Text>
                </View>
            )  
    } else {
        return null;
    }
    
}