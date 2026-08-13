import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack > 
    <Stack.Screen name="index" options={{ title: "Home"}} />
    {/* <Stack.Screen
  name="index"
  options={{
    title: "Home",
    headerBackTitle: "",
    headerTitleAlign: "center",
  }}
/> */}
    <Stack.Screen name="pokemonDetails" options={{ title: "Pokemon Details", headerBackButtonDisplayMode: "minimal", presentation: "modal" }} />
  </Stack>;
}
