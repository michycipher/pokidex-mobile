import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";

type PokemonType = {
  slot: number;
  type: {
    name: string;
    url: string;
  };
};

type PokemonAbility = {
  is_hidden: boolean;
  slot: number;
  ability: {
    name: string;
    url: string;
  };
};

type PokemonStat = {
  base_stat: number;
  effort: number;
  stat: {
    name: string;
    url: string;
  };
};

type PokemonMove = {
  move: {
    name: string;
    url: string;
  };
};

type PokemonDetails = {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  types: PokemonType[];
  abilities: PokemonAbility[];
  stats: PokemonStat[];
  moves: PokemonMove[];
  sprites: {
    front_default: string | null;
    other?: {
      ["official-artwork"]?: {
        front_default: string | null;
        front_shiny?: string | null;
      };
      home?: {
        front_default: string | null;
      };
    };
  };
};

type SpeciesDetails = {
  flavor_text_entries: {
    flavor_text: string;
    language: {
      name: string;
    };
  }[];
  genera: {
    genus: string;
    language: {
      name: string;
    };
  }[];
  habitat: {
    name: string;
  } | null;
  generation: {
    name: string;
  };
  growth_rate: {
    name: string;
  };
  gender_rate: number;
  capture_rate: number;
  base_happiness: number;
  egg_groups: {
    name: string;
  }[];
};

const TYPE_COLORS: Record<string, string> = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  grass: "#78C850",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
};

const STAT_COLORS: Record<string, string> = {
  hp: "#FF5959",
  attack: "#F5AC78",
  defense: "#FAE078",
  "special-attack": "#9DB7F5",
  "special-defense": "#A7DB8D",
  speed: "#FA92B2",
};

const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Sp. Atk",
  "special-defense": "Sp. Def",
  speed: "Speed",
};

function capitalize(value?: string) {
  if (!value) return "Unknown";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatName(value?: string) {
  if (!value) return "Unknown";

  return value
    .split("-")
    .map(capitalize)
    .join(" ");
}

function formatPokemonId(id: number) {
  return `#${id.toString().padStart(4, "0")}`;
}

function formatGeneration(value?: string) {
  if (!value) return "Unknown";

  return value
    .replace("generation-", "")
    .toUpperCase();
}

function cleanDescription(value?: string) {
  return value?.replace(/\f/g, " ").replace(/\n/g, " ").replace(/\s+/g, " ");
}

export default function PokemonDetailsScreen() {
  const params = useLocalSearchParams<{ name?: string | string[] }>();

  const pokemonName = Array.isArray(params.name)
    ? params.name[0]
    : params.name;

  const [pokemon, setPokemon] = useState<PokemonDetails | null>(null);
  const [species, setSpecies] = useState<SpeciesDetails | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenTranslate = useRef(new Animated.Value(25)).current;

  const imageScale = useRef(new Animated.Value(0.8)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const floatAnimation = useRef(new Animated.Value(0)).current;

  const statAnimations = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(0)),
  ).current;

  const fetchPokemonDetails = useCallback(
    async (isRefreshing = false) => {
      if (!pokemonName) {
        setError("Pokémon name was not provided.");
        setLoading(false);
        return;
      }

      try {
        if (!isRefreshing) {
          setLoading(true);
        }

        setError(null);

        const pokemonResponse = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`,
        );

        if (!pokemonResponse.ok) {
          throw new Error("Pokémon could not be found.");
        }

        const pokemonData: PokemonDetails = await pokemonResponse.json();

        const speciesResponse = await fetch(
          `https://pokeapi.co/api/v2/pokemon-species/${pokemonData.id}`,
        );

        if (!speciesResponse.ok) {
          throw new Error("Pokémon species information could not be loaded.");
        }

        const speciesData: SpeciesDetails = await speciesResponse.json();

        setPokemon(pokemonData);
        setSpecies(speciesData);
      } catch (err) {
        console.error("Error fetching Pokémon:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading this Pokémon.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [pokemonName],
  );

  useEffect(() => {
    fetchPokemonDetails();
  }, [fetchPokemonDetails]);

  useEffect(() => {
    if (!pokemon) return;

    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(screenTranslate, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.spring(imageScale, {
        toValue: 1,
        friction: 6,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    statAnimations.forEach((animation) => animation.setValue(0));

    Animated.stagger(
      100,
      statAnimations.map((animation) =>
        Animated.timing(animation, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ),
    ).start();

    const floating = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnimation, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnimation, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    floating.start();

    return () => {
      floating.stop();
    };
  }, [pokemon]);

  const primaryType = pokemon?.types?.[0]?.type.name ?? "normal";

  const primaryColor = TYPE_COLORS[primaryType] ?? TYPE_COLORS.normal;

  const secondaryColor =
    pokemon?.types?.[1]?.type.name &&
    TYPE_COLORS[pokemon.types[1].type.name]
      ? TYPE_COLORS[pokemon.types[1].type.name]
      : primaryColor;

  const description = useMemo(() => {
    if (!species) return "";

    const englishEntries = species.flavor_text_entries.filter(
      (entry) => entry.language.name === "en",
    );

    return cleanDescription(englishEntries[0]?.flavor_text);
  }, [species]);

  const genus = useMemo(() => {
    return species?.genera.find((item) => item.language.name === "en")?.genus;
  }, [species]);

  const artwork =
    pokemon?.sprites.other?.["official-artwork"]?.front_default ??
    pokemon?.sprites.other?.home?.front_default ??
    pokemon?.sprites.front_default;

  const totalStats =
    pokemon?.stats.reduce((total, stat) => total + stat.base_stat, 0) ?? 0;

  const floatingY = floatAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPokemonDetails(true);
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "",
            headerTransparent: true,
            headerShadowVisible: false,
          }}
        />

        <View
          style={[styles.loadingContainer, { backgroundColor: primaryColor }]}
        >
          <View style={styles.loadingIcon}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>

          <Text style={styles.loadingTitle}>Finding Pokémon</Text>
          <Text style={styles.loadingText}>
            Loading Pokédex information...
          </Text>
        </View>
      </>
    );
  }

  if (error || !pokemon) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Pokémon",
          }}
        />

        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorIconText}>!</Text>
          </View>

          <Text style={styles.errorTitle}>Unable to load Pokémon</Text>

          <Text style={styles.errorMessage}>
            {error ?? "The requested Pokémon could not be found."}
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.retryButtonPressed,
            ]}
            onPress={() => fetchPokemonDetails()}
          >
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: capitalize(pokemon.name),
          headerTransparent: true,
          headerShadowVisible: false,
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "700",
          },
        }}
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
          />
        }
        style={{
          opacity: screenOpacity,
          transform: [{ translateY: screenTranslate }],
        }}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HERO */}
        <View
          style={[
            styles.hero,
            {
              backgroundColor: primaryColor,
            },
          ]}
        >
          {/* Decorative Pokéball */}
          <View style={styles.pokeballDecoration}>
            <View style={styles.pokeballLine} />
            <View style={styles.pokeballCenter}>
              <View style={styles.pokeballInnerCenter} />
            </View>
          </View>

          <View style={styles.heroTopContent}>
            <View style={styles.titleContainer}>
              <Text style={styles.pokemonName}>
                {capitalize(pokemon.name)}
              </Text>

              <Text style={styles.genus}>
                {genus ?? "Pokémon"}
              </Text>
            </View>

            <Text style={styles.pokemonId}>
              {formatPokemonId(pokemon.id)}
            </Text>
          </View>

          <View style={styles.typeRow}>
            {pokemon.types.map(({ type }) => (
              <View
                key={type.name}
                style={[
                  styles.typeBadge,
                  {
                    backgroundColor:
                      TYPE_COLORS[type.name] ?? "rgba(255,255,255,0.2)",
                  },
                ]}
              >
                <View style={styles.typeDot} />

                <Text style={styles.typeText}>
                  {capitalize(type.name)}
                </Text>
              </View>
            ))}
          </View>

          {artwork ? (
            <Animated.View
              style={[
                styles.imageWrapper,
                {
                  opacity: imageOpacity,
                  transform: [
                    { scale: imageScale },
                    { translateY: floatingY },
                  ],
                },
              ]}
            >
              <Image
                source={{ uri: artwork }}
                style={styles.pokemonImage}
                resizeMode="contain"
              />
            </Animated.View>
          ) : null}
        </View>

        {/* BODY */}
        <View style={styles.body}>
          {/* QUICK INFO */}
          <View style={styles.quickInfoCard}>
            <InfoColumn
              label="Height"
              value={`${(pokemon.height / 10).toFixed(1)} m`}
            />

            <View style={styles.verticalDivider} />

            <InfoColumn
              label="Weight"
              value={`${(pokemon.weight / 10).toFixed(1)} kg`}
            />

            <View style={styles.verticalDivider} />

            <InfoColumn
              label="Base XP"
              value={pokemon.base_experience?.toString() ?? "—"}
            />
          </View>

          {/* ABOUT */}
          <Section title="About">
            <Text style={styles.description}>
              {description || "No Pokédex description is available."}
            </Text>

            <View style={styles.detailsCard}>
              <DetailRow
                label="Species"
                value={genus ?? capitalize(pokemon.name)}
              />

              <DetailRow
                label="Habitat"
                value={formatName(species?.habitat?.name)}
              />

              <DetailRow
                label="Generation"
                value={formatGeneration(species?.generation?.name)}
              />

              <DetailRow
                label="Growth Rate"
                value={formatName(species?.growth_rate?.name)}
              />

              <DetailRow
                label="Capture Rate"
                value={`${species?.capture_rate ?? "—"}`}
                last
              />
            </View>
          </Section>

          {/* ABILITIES */}
          <Section title="Abilities">
            <View style={styles.abilitiesContainer}>
              {pokemon.abilities.map((item) => (
                <View
                  key={item.ability.name}
                  style={[
                    styles.abilityCard,
                    {
                      borderColor: `${primaryColor}35`,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.abilityNumber,
                      {
                        backgroundColor: `${primaryColor}18`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.abilityNumberText,
                        {
                          color: primaryColor,
                        },
                      ]}
                    >
                      {item.slot}
                    </Text>
                  </View>

                  <View style={styles.abilityContent}>
                    <Text style={styles.abilityName}>
                      {formatName(item.ability.name)}
                    </Text>

                    <Text style={styles.abilityDescription}>
                      {item.is_hidden
                        ? "Hidden ability"
                        : "Standard ability"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Section>

          {/* BASE STATS */}
          <Section title="Base Stats">
            <View style={styles.statsCard}>
              {pokemon.stats.map((item, index) => {
                const statName = item.stat.name;

                // 255 is effectively the maximum possible base stat.
                const progress = Math.min(item.base_stat / 255, 1);

                const animatedWidth = statAnimations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", `${progress * 100}%`],
                });

                return (
                  <View style={styles.statRow} key={statName}>
                    <Text style={styles.statLabel}>
                      {STAT_LABELS[statName] ?? formatName(statName)}
                    </Text>

                    <Text style={styles.statValue}>
                      {item.base_stat}
                    </Text>

                    <View style={styles.statTrack}>
                      <Animated.View
                        style={[
                          styles.statProgress,
                          {
                            width: animatedWidth,
                            backgroundColor:
                              STAT_COLORS[statName] ?? primaryColor,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}

              <View style={styles.totalStatContainer}>
                <Text style={styles.totalLabel}>Total</Text>

                <Text style={styles.totalValue}>
                  {totalStats}
                </Text>

                <View style={styles.totalTrack}>
                  <View
                    style={[
                      styles.totalProgress,
                      {
                        backgroundColor: secondaryColor,
                        width: `${Math.min(totalStats / 720, 1) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </Section>

          {/* BREEDING */}
          <Section title="Breeding">
            <View style={styles.detailsCard}>
              <DetailRow
                label="Gender"
                value={getGenderRatio(species?.gender_rate)}
              />

              <DetailRow
                label="Egg Groups"
                value={
                  species?.egg_groups
                    ?.map((group) => formatName(group.name))
                    .join(", ") || "Unknown"
                }
              />

              <DetailRow
                label="Base Happiness"
                value={`${species?.base_happiness ?? "—"}`}
                last
              />
            </View>
          </Section>

          {/* MOVES */}
          <Section
            title="Moves"
            subtitle={`${pokemon.moves.length} known moves`}
          >
            <View style={styles.moveContainer}>
              {pokemon.moves.slice(0, 12).map(({ move }) => (
                <View
                  key={move.name}
                  style={[
                    styles.moveBadge,
                    {
                      borderColor: `${primaryColor}30`,
                      backgroundColor: `${primaryColor}0D`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.moveText,
                      {
                        color: primaryColor,
                      },
                    ]}
                  >
                    {formatName(move.name)}
                  </Text>
                </View>
              ))}
            </View>

            {pokemon.moves.length > 12 && (
              <Text style={styles.moreMoves}>
                + {pokemon.moves.length - 12} more moves
              </Text>
            )}
          </Section>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Pokédex #{pokemon.id}
            </Text>
          </View>
        </View>
      </Animated.ScrollView>
    </>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>

        {subtitle ? (
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        ) : null}
      </View>

      {children}
    </View>
  );
}

function InfoColumn({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoColumn}>
      <Text style={styles.infoValue}>{value}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
  );
}

function DetailRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.detailRow,
        !last && styles.detailRowBorder,
      ]}
    >
      <Text style={styles.detailLabel}>{label}</Text>

      <Text style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

function getGenderRatio(genderRate?: number) {
  if (genderRate === undefined) return "Unknown";

  if (genderRate === -1) {
    return "Genderless";
  }

  const female = (genderRate / 8) * 100;
  const male = 100 - female;

  return `${male.toFixed(1)}% ♂  •  ${female.toFixed(1)}% ♀`;
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: "#F7F8FA",
  },

  hero: {
    minHeight: 460,
    paddingTop: 110,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: "hidden",
    position: "relative",
  },

  heroTopContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    zIndex: 3,
  },

  titleContainer: {
    flex: 1,
    paddingRight: 15,
  },

  pokemonName: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
  },

  genus: {
    marginTop: 4,
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    fontWeight: "600",
  },

  pokemonId: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 10,
  },

  typeRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 18,
    zIndex: 3,
  },

  typeBadge: {
    borderRadius: 50,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },

  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },

  typeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  imageWrapper: {
    width: 300,
    height: 300,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -10,
    zIndex: 3,
  },

  pokemonImage: {
    width: "100%",
    height: "100%",
  },

  pokeballDecoration: {
    width: 290,
    height: 290,
    position: "absolute",
    right: -90,
    bottom: -40,
    borderRadius: 145,
    borderWidth: 28,
    borderColor: "rgba(255,255,255,0.10)",
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "-15deg" }],
  },

  pokeballLine: {
    position: "absolute",
    width: "100%",
    height: 28,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  pokeballCenter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 22,
    borderColor: "rgba(255,255,255,0.10)",
    justifyContent: "center",
    alignItems: "center",
  },

  pokeballInnerCenter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  body: {
    paddingHorizontal: 18,
    paddingTop: 22,
  },

  quickInfoCard: {
    minHeight: 96,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 18,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },

  infoColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  infoValue: {
    color: "#1C1C1E",
    fontSize: 17,
    fontWeight: "800",
  },

  infoLabel: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "600",
  },

  verticalDivider: {
    width: 1,
    height: 38,
    backgroundColor: "#ECECEF",
  },

  section: {
    marginTop: 30,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },

  sectionTitle: {
    color: "#1D1D1F",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  sectionSubtitle: {
    color: "#9A9AA0",
    fontSize: 12,
    fontWeight: "600",
  },

  description: {
    color: "#55555C",
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "400",
    marginBottom: 16,
  },

  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
  },

  detailRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },

  detailRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EEEEF1",
  },

  detailLabel: {
    color: "#96969C",
    fontSize: 13,
    fontWeight: "600",
  },

  detailValue: {
    flex: 1,
    color: "#28282C",
    textAlign: "right",
    fontSize: 14,
    fontWeight: "700",
  },

  abilitiesContainer: {
    gap: 10,
  },

  abilityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },

  abilityNumber: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },

  abilityNumberText: {
    fontWeight: "900",
    fontSize: 15,
  },

  abilityContent: {
    marginLeft: 13,
    flex: 1,
  },

  abilityName: {
    color: "#262629",
    fontSize: 15,
    fontWeight: "800",
  },

  abilityDescription: {
    color: "#9A9A9F",
    fontSize: 12,
    marginTop: 3,
  },

  statsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
  },

  statRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 17,
  },

  statLabel: {
    width: 72,
    color: "#7D7D84",
    fontSize: 12,
    fontWeight: "700",
  },

  statValue: {
    width: 35,
    textAlign: "right",
    marginRight: 12,
    color: "#2B2B2F",
    fontSize: 13,
    fontWeight: "900",
  },

  statTrack: {
    flex: 1,
    height: 7,
    borderRadius: 100,
    backgroundColor: "#EEEEF1",
    overflow: "hidden",
  },

  statProgress: {
    height: "100%",
    borderRadius: 100,
  },

  totalStatContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 3,
  },

  totalLabel: {
    width: 72,
    color: "#303034",
    fontSize: 12,
    fontWeight: "900",
  },

  totalValue: {
    width: 35,
    textAlign: "right",
    marginRight: 12,
    color: "#1D1D1F",
    fontSize: 13,
    fontWeight: "900",
  },

  totalTrack: {
    flex: 1,
    height: 7,
    borderRadius: 100,
    backgroundColor: "#EEEEF1",
    overflow: "hidden",
  },

  totalProgress: {
    height: "100%",
    borderRadius: 100,
  },

  moveContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  moveBadge: {
    borderRadius: 50,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 13,
  },

  moveText: {
    fontSize: 12,
    fontWeight: "700",
  },

  moreMoves: {
    textAlign: "center",
    color: "#98989D",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 14,
  },

  footer: {
    alignItems: "center",
    paddingVertical: 40,
  },

  footerText: {
    color: "#B3B3B8",
    fontSize: 12,
    fontWeight: "700",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  loadingTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },

  loadingText: {
    color: "rgba(255,255,255,0.75)",
    marginTop: 7,
    fontSize: 14,
  },

  errorContainer: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  errorIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFE8E8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  errorIconText: {
    fontSize: 30,
    fontWeight: "900",
    color: "#E24848",
  },

  errorTitle: {
    color: "#232326",
    fontSize: 21,
    fontWeight: "900",
  },

  errorMessage: {
    color: "#89898F",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 300,
    marginTop: 8,
  },

  retryButton: {
    marginTop: 22,
    backgroundColor: "#252529",
    paddingVertical: 13,
    paddingHorizontal: 25,
    borderRadius: 14,
  },

  retryButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});




// import { useEffect, useState } from "react";
// import { Image, Text, View, StyleSheet, ScrollView } from "react-native";
// import { Stack, useLocalSearchParams } from "expo-router";

// export default function pokemonDetails() {
//   const params = useLocalSearchParams();

//   useEffect(() => {
//     console.log("Params:", params);
//   }, [params]);
//   async function fetchPokemonDetails() {
//     try {
//       const response = await fetch(
//         `https://pokeapi.co/api/v2/pokemon/${params.name}`,
//       );
//       const data = await response.json();
//       console.log("Pokemon Details:", data);
//     } catch (error) {
//       console.error("Error fetching Pokemon details:", error);
//     }
//   }

//   useEffect(() => {
//     fetchPokemonDetails();
//   }, [params.name]);

//   return (
//     <>
//     <Stack.Screen options={{ title: params.name as string}} />
//     <ScrollView
//       contentContainerStyle={{
//         flexGrow: 1,
//         justifyContent: "center",
//         alignItems: "center",
//         gap: 16,
//         padding: 16,
//       }}
//     >
//       <View>
//         <Text style={{ fontSize: 24, fontWeight: "bold" }}>{params.name}</Text>
//         {/* You can add more details about the Pokemon here */}
//       </View>
//     </ScrollView>
//     </>
//   );
// }

// const styles = StyleSheet.create({});
