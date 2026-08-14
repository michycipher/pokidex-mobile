import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Link } from "expo-router";

interface TypeRef {
  name: string;
  url: string;
}

interface DetailedType {
  slot: number;
  type: TypeRef;
}

interface Pokemon {
  id: number;
  name: string;
  imageUrl: string;
  types: DetailedType[];
}

interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    name: string;
    url: string;
  }[];
}

const colorsByType = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};

const PAGE_SIZE = 20;

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatPokemonId(id: number) {
  return `#${id.toString().padStart(4, "0")}`;
}

export default function Index() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [page, setPage] = useState(1);
  const [totalPokemon, setTotalPokemon] = useState(0);

  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(() => {
    return Math.ceil(totalPokemon / PAGE_SIZE);
  }, [totalPokemon]);

  const fetchPokemons = useCallback(
    async (
      targetPage = 1,
      options?: {
        refreshing?: boolean;
      },
    ) => {
      const isRefresh = options?.refreshing ?? false;

      try {
        setError(null);

        if (isRefresh) {
          setRefreshing(true);
        } else if (targetPage === 1 && pokemons.length === 0) {
          setLoading(true);
        } else {
          setPageLoading(true);
        }

        const offset = (targetPage - 1) * PAGE_SIZE;

        const response = await fetch(
          `https://pokeapi.co/api/v2/pokemon?limit=${PAGE_SIZE}&offset=${offset}`,
        );

        if (!response.ok) {
          throw new Error("Unable to load Pokémon.");
        }

        const data: PokemonListResponse = await response.json();

        const detailedPokemons = await Promise.all(
          data.results.map(async (pokemon) => {
            const detailResponse = await fetch(pokemon.url);

            if (!detailResponse.ok) {
              throw new Error(`Unable to load ${pokemon.name}`);
            }

            const detailedData = await detailResponse.json();

            return {
              id: detailedData.id,
              name: detailedData.name,
              imageUrl:
                detailedData.sprites?.other?.["official-artwork"]
                  ?.front_default ??
                detailedData.sprites?.other?.home?.front_default ??
                detailedData.sprites?.front_default,
              types: detailedData.types,
            };
          }),
        );

        setPokemons(detailedPokemons);
        setTotalPokemon(data.count);
        setPage(targetPage);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading the Pokidex.",
        );
      } finally {
        setLoading(false);
        setPageLoading(false);
        setRefreshing(false);
      }
    },
    [pokemons.length],
  );

  useEffect(() => {
    fetchPokemons(1);
  }, []);

  const handleNextPage = () => {
    if (page >= totalPages || pageLoading) return;

    fetchPokemons(page + 1);
  };

  const handlePreviousPage = () => {
    if (page <= 1 || pageLoading) return;

    fetchPokemons(page - 1);
  };

  const handleRefresh = () => {
    fetchPokemons(page, {
      refreshing: true,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingPokeball}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>

        <Text style={styles.loadingTitle}>Opening Pokidex</Text>

        <Text style={styles.loadingDescription}>
          Discovering Pokémon from around the world...
        </Text>
      </View>
    );
  }

  if (error && pokemons.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIcon}>
          <Text style={styles.errorIconText}>!</Text>
        </View>

        <Text style={styles.errorTitle}>Pokidex unavailable</Text>

        <Text style={styles.errorMessage}>{error}</Text>

        <Pressable
          onPress={() => fetchPokemons(1)}
          style={({ pressed }) => [
            styles.retryButton,
            pressed && {
              opacity: 0.8,
              transform: [{ scale: 0.97 }],
            },
          ]}
        >
          <Text style={styles.retryButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={pokemons}
      keyExtractor={(item) => item.id.toString()}
      numColumns={2}
      showsVerticalScrollIndicator={false}
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#EF5350"
        />
      }
      ListHeaderComponent={
        <View>
          <Hero />

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>EXPLORE</Text>

              <Text style={styles.sectionTitle}>
                Pokémon
              </Text>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {totalPokemon.toLocaleString()}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionDescription}>
            Choose a Pokémon to view its abilities, stats, habitat, moves and
            Pokidex information.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <PokemonCard pokemon={item} />
      )}
      ListFooterComponent={
        <Pagination
          page={page}
          totalPages={totalPages}
          loading={pageLoading}
          onPrevious={handlePreviousPage}
          onNext={handleNextPage}
        />
      }
    />
  );
}

function Hero() {
  return (
    <View style={styles.hero}>
      <View style={styles.heroGlowOne} />
      <View style={styles.heroGlowTwo} />

      <View style={styles.heroPokeball}>
        <View style={styles.heroPokeballLine} />

        <View style={styles.heroPokeballCenter}>
          <View style={styles.heroPokeballInner} />
        </View>
      </View>

      <View style={styles.heroContent}>
        <View style={styles.heroBadge}>
          <View style={styles.heroBadgeDot} />

          <Text style={styles.heroBadgeText}>
            Pokidex
          </Text>
        </View>

        <Text style={styles.heroTitle}>
          Gotta catch{"\n"}
          <Text style={styles.heroTitleAccent}>
            ’em all.
          </Text>
        </Text>

        <Text style={styles.heroDescription}>
          Explore Pokémon, discover their abilities and learn what makes every
          species unique.
        </Text>

        <View style={styles.heroStats}>
          <View>
            <Text style={styles.heroStatValue}>
              1,000+
            </Text>

            <Text style={styles.heroStatLabel}>
              Pokémon
            </Text>
          </View>

          <View style={styles.heroDivider} />

          <View>
            <Text style={styles.heroStatValue}>
              18
            </Text>

            <Text style={styles.heroStatLabel}>
              Types
            </Text>
          </View>

          <View style={styles.heroDivider} />

          <View>
            <Text style={styles.heroStatValue}>
              IX
            </Text>

            <Text style={styles.heroStatLabel}>
              Generations
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function PokemonCard({
  pokemon,
}: {
  pokemon: Pokemon;
}) {
  const primaryType =
    pokemon.types[0]?.type.name as keyof typeof colorsByType;

  const primaryColor =
    colorsByType[primaryType] ?? colorsByType.normal;

  return (
    <Link
      href={{
        pathname: "/pokemonDetails",
        params: {
          name: pokemon.name,
        },
      }}
      asChild
    >
      <Pressable
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: primaryColor,
          },
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.cardTop}>
          <Text style={styles.pokemonNumber}>
            {formatPokemonId(pokemon.id)}
          </Text>
        </View>

        <Text
          numberOfLines={1}
          style={styles.pokemonName}
        >
          {capitalize(pokemon.name)}
        </Text>

        <View style={styles.typesContainer}>
          {pokemon.types.map(({ type }) => (
            <View
              key={type.name}
              style={styles.typeBadge}
            >
              <View style={styles.typeDot} />

              <Text style={styles.typeText}>
                {capitalize(type.name)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.imageContainer}>
          {pokemon.imageUrl ? (
            <Image
              source={{
                uri: pokemon.imageUrl,
              }}
              style={styles.pokemonImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imageFallback}>
              <Text style={styles.imageFallbackText}>
                ?
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.viewDetails}>
            View details
          </Text>

          <View style={styles.arrowButton}>
            <Text style={styles.arrowText}>›</Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}


function Pagination({
  page,
  totalPages,
  loading,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  loading: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.paginationContainer}>
      <View style={styles.paginationTop}>
        <Text style={styles.paginationTitle}>
          Pokidex pages
        </Text>

        <Text style={styles.paginationInfo}>
          Page {page} of {totalPages}
        </Text>
      </View>

      <View style={styles.paginationControls}>
        <Pressable
          disabled={page === 1 || loading}
          onPress={onPrevious}
          style={({ pressed }) => [
            styles.paginationButton,
            page === 1 && styles.paginationButtonDisabled,
            pressed &&
              page !== 1 &&
              styles.paginationButtonPressed,
          ]}
        >
          <Text
            style={[
              styles.paginationButtonText,
              page === 1 &&
                styles.paginationButtonTextDisabled,
            ]}
          >
            ‹ Previous
          </Text>
        </Pressable>

        <View style={styles.currentPage}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color="#EF5350"
            />
          ) : (
            <Text style={styles.currentPageText}>
              {page}
            </Text>
          )}
        </View>

        <Pressable
          disabled={page >= totalPages || loading}
          onPress={onNext}
          style={({ pressed }) => [
            styles.paginationButton,
            page >= totalPages &&
              styles.paginationButtonDisabled,
            pressed &&
              page < totalPages &&
              styles.paginationButtonPressed,
          ]}
        >
          <Text
            style={[
              styles.paginationButtonText,
              page >= totalPages &&
                styles.paginationButtonTextDisabled,
            ]}
          >
            Next ›
          </Text>
        </Pressable>
      </View>

      <Text style={styles.paginationHint}>
        Showing {(page - 1) * PAGE_SIZE + 1}–
        {Math.min(page * PAGE_SIZE, totalPages * PAGE_SIZE)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 45,
    backgroundColor: "#F7F8FA",
  },

  columnWrapper: {
    paddingHorizontal: 16,
    gap: 12,
  },

  hero: {
    minHeight: 385,
    marginBottom: 30,
    paddingHorizontal: 24,
    paddingTop: 42,
    paddingBottom: 32,

    backgroundColor: "#EF5350",

    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 38,

    overflow: "hidden",

    position: "relative",
  },

  heroContent: {
    zIndex: 5,
  },

  heroGlowOne: {
    position: "absolute",
    width: 240,
    height: 240,

    borderRadius: 120,

    backgroundColor: "rgba(255,255,255,0.07)",

    top: -80,
    left: -90,
  },

  heroGlowTwo: {
    position: "absolute",
    width: 190,
    height: 190,

    borderRadius: 95,

    backgroundColor: "rgba(255,255,255,0.05)",

    bottom: -70,
    right: 30,
  },

  heroBadge: {
    alignSelf: "flex-start",

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 13,
    paddingVertical: 8,

    borderRadius: 100,

    backgroundColor: "rgba(255,255,255,0.15)",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",

    gap: 7,
  },

  heroBadgeDot: {
    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor: "#FFFFFF",
  },

  heroBadgeText: {
    color: "#FFFFFF",

    fontWeight: "800",

    fontSize: 12,

    letterSpacing: 0.4,
  },

  heroTitle: {
    marginTop: 22,

    color: "#FFFFFF",

    fontSize: 45,

    lineHeight: 50,

    letterSpacing: -2,

    fontWeight: "900",
  },

  heroTitleAccent: {
    color: "#FFE082",
  },

  heroDescription: {
    color: "rgba(255,255,255,0.82)",

    maxWidth: 310,

    marginTop: 14,

    fontSize: 15,

    lineHeight: 23,

    fontWeight: "500",
  },

  heroStats: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 30,

    gap: 20,
  },

  heroStatValue: {
    color: "#FFFFFF",

    fontSize: 18,

    fontWeight: "900",
  },

  heroStatLabel: {
    color: "rgba(255,255,255,0.65)",

    fontSize: 11,

    fontWeight: "600",

    marginTop: 2,
  },

  heroDivider: {
    width: 1,
    height: 30,

    backgroundColor: "rgba(255,255,255,0.2)",
  },

  heroPokeball: {
    position: "absolute",

    width: 250,
    height: 250,

    borderRadius: 125,

    borderWidth: 25,

    borderColor: "rgba(255,255,255,0.1)",

    right: -90,
    bottom: -50,

    justifyContent: "center",
    alignItems: "center",

    transform: [
      {
        rotate: "-18deg",
      },
    ],
  },

  heroPokeballLine: {
    position: "absolute",

    width: "100%",
    height: 25,

    backgroundColor: "rgba(255,255,255,0.1)",
  },

  heroPokeballCenter: {
    width: 75,
    height: 75,

    borderRadius: 40,

    borderWidth: 20,

    borderColor: "rgba(255,255,255,0.1)",
  },

  heroPokeballInner: {
    width: 20,
    height: 20,

    borderRadius: 10,

    backgroundColor: "rgba(255,255,255,0.1)",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",

    paddingHorizontal: 18,
  },

  sectionEyebrow: {
    color: "#EF5350",

    fontWeight: "900",

    fontSize: 11,

    letterSpacing: 1.5,

    marginBottom: 4,
  },

  sectionTitle: {
    color: "#1C1C1E",

    fontSize: 29,

    fontWeight: "900",

    letterSpacing: -1,
  },

  countBadge: {
    minWidth: 62,

    paddingHorizontal: 12,
    paddingVertical: 7,

    borderRadius: 100,

    backgroundColor: "#FFFFFF",

    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,

    elevation: 2,
  },

  countText: {
    color: "#000",

    fontSize: 12,

    fontWeight: "800",
  },

  sectionDescription: {
    paddingHorizontal: 18,

    color: "#8A8A8F",

    fontSize: 14,

    lineHeight: 21,

    marginTop: 8,
    marginBottom: 18,

    maxWidth: 390,
  },

  card: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "space-between",

    minHeight: 260,

    padding: 15,

    marginBottom: 12,

    borderRadius: 25,

    overflow: "hidden",

    position: "relative",

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 7,
    },

    shadowOpacity: 0.08,

    shadowRadius: 10,

    elevation: 4,
  },

  cardPressed: {
    opacity: 0.9,

    transform: [
      {
        scale: 0.97,
      },
    ],
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "flex-end",

    paddingTop: 20,

    zIndex: 3,
  },

  pokemonNumber: {
    color: "rgba(10, 10, 10, 0.6)",

    fontSize: 11,

    fontWeight: "900",
  },

  pokemonName: {
    color: "#000",

    fontSize: 20,

    fontWeight: "900",

    letterSpacing: -0.5,

    marginTop: 3,

    alignSelf: "flex-end",

    zIndex: 3,
  },

  typesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",

    gap: 5,

    marginTop: 9,

    zIndex: 5,
  },

  typeBadge: {
    flexDirection: "row",
    alignItems: "center",

    gap: 4,

    paddingHorizontal: 8,
    paddingVertical: 5,

    borderRadius: 100,

    backgroundColor: "rgba(24, 22, 22, 0.7)",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },

  typeDot: {
    width: 4,
    height: 4,

    borderRadius: 2,

    backgroundColor: "#000",
  },

  typeText: {
    color: "#FFFFFF",

    fontWeight: "700",

    fontSize: 9,
  },

  imageContainer: {
    width: "100%",
    height: 120,

    alignItems: "center",
    justifyContent: "center",

    marginTop: -2,

    zIndex: 3,
  },

  pokemonImage: {
    width: 130,
    height: 130,
  },

  imageFallback: {
    width: 90,
    height: 90,

    borderRadius: 45,

    backgroundColor: "rgba(255,255,255,0.15)",

    justifyContent: "center",
    alignItems: "center",
  },

  imageFallbackText: {
    color: "#000",

    fontSize: 35,

    fontWeight: "900",
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    width: "100%",

    marginTop: "auto",

    zIndex: 3,
  },

  viewDetails: {
    color: "rgba(0,0,0,0.8)",

    fontSize: 10,

    fontWeight: "700",
  },

  arrowButton: {
    width: 28,
    height: 28,

    borderRadius: 14,

    justifyContent: "center",
    alignItems: "center",

    backgroundColor: "rgba(16, 14, 14, 0.2)",
  },

  arrowText: {
    color: "#000",

    fontSize: 22,

    lineHeight: 24,

    marginTop: -2,

    fontWeight: "600",
  },

  paginationContainer: {
    marginHorizontal: 16,
    marginTop: 16,

    backgroundColor: "#FFFFFF",

    borderRadius: 24,

    padding: 17,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,

    elevation: 2,
  },

  paginationTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    marginBottom: 16,
  },

  paginationTitle: {
    color: "#1D1D1F",

    fontSize: 15,

    fontWeight: "900",
  },

  paginationInfo: {
    color: "#96969C",

    fontSize: 11,

    fontWeight: "700",
  },

  paginationControls: {
    flexDirection: "row",
    alignItems: "center",

    gap: 10,
  },

  paginationButton: {
    flex: 1,

    paddingVertical: 13,

    backgroundColor: "#F4F4F6",

    borderRadius: 14,

    alignItems: "center",
  },

  paginationButtonPressed: {
    transform: [
      {
        scale: 0.97,
      },
    ],

    opacity: 0.8,
  },

  paginationButtonDisabled: {
    opacity: 0.45,
  },

  paginationButtonText: {
    color: "#303034",

    fontSize: 12,

    fontWeight: "800",
  },

  paginationButtonTextDisabled: {
    color: "#AAAAAF",
  },

  currentPage: {
    width: 44,
    height: 44,

    borderRadius: 14,

    backgroundColor: "#FFF1F1",

    justifyContent: "center",
    alignItems: "center",
  },

  currentPageText: {
    color: "#EF5350",

    fontSize: 15,

    fontWeight: "900",
  },

  paginationHint: {
    textAlign: "center",

    color: "#AAAAAF",

    fontSize: 10,

    fontWeight: "600",

    marginTop: 12,
  },

  loadingContainer: {
    flex: 1,

    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: 30,

    backgroundColor: "#EF5350",
  },

  loadingPokeball: {
    width: 85,
    height: 85,

    borderRadius: 43,

    backgroundColor: "rgba(255,255,255,0.16)",

    justifyContent: "center",
    alignItems: "center",

    marginBottom: 20,
  },

  loadingTitle: {
    color: "#FFFFFF",

    fontSize: 24,

    fontWeight: "900",
  },

  loadingDescription: {
    color: "rgba(255,255,255,0.72)",

    fontSize: 13,

    textAlign: "center",

    marginTop: 7,
  },

  errorContainer: {
    flex: 1,

    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: 30,

    backgroundColor: "#F7F8FA",
  },

  errorIcon: {
    width: 70,
    height: 70,

    borderRadius: 35,

    backgroundColor: "#FFE7E7",

    justifyContent: "center",
    alignItems: "center",

    marginBottom: 18,
  },

  errorIconText: {
    color: "#EF5350",

    fontSize: 30,

    fontWeight: "900",
  },

  errorTitle: {
    color: "#242427",

    fontSize: 21,

    fontWeight: "900",
  },

  errorMessage: {
    color: "#8D8D92",

    fontSize: 13,

    lineHeight: 20,

    textAlign: "center",

    marginTop: 7,
  },

  retryButton: {
    marginTop: 20,

    paddingHorizontal: 25,
    paddingVertical: 13,

    borderRadius: 14,

    backgroundColor: "#EF5350",
  },

  retryButtonText: {
    color: "#FFFFFF",

    fontSize: 13,

    fontWeight: "800",
  },
});






// import { useCallback, useEffect, useMemo, useState } from "react";
// import {
//   ActivityIndicator,
//   FlatList,
//   Image,
//   Pressable,
//   RefreshControl,
//   StyleSheet,
//   Text,
//   View,
// } from "react-native";
// import { Link } from "expo-router";

// interface TypeRef {
//   name: string;
//   url: string;
// }

// interface DetailedType {
//   slot: number;
//   type: TypeRef;
// }

// interface Pokemon {
//   id: number;
//   name: string;
//   imageUrl: string;
//   types: DetailedType[];
// }

// interface PokemonListResponse {
//   count: number;
//   next: string | null;
//   previous: string | null;
//   results: {
//     name: string;
//     url: string;
//   }[];
// }

// const colorsByType = {
//   normal: "#A8A77A",
//   fire: "#EE8130",
//   water: "#6390F0",
//   electric: "#F7D02C",
//   grass: "#7AC74C",
//   ice: "#96D9D6",
//   fighting: "#C22E28",
//   poison: "#A33EA1",
//   ground: "#E2BF65",
//   flying: "#A98FF3",
//   psychic: "#F95587",
//   bug: "#A6B91A",
//   rock: "#B6A136",
//   ghost: "#735797",
//   dragon: "#6F35FC",
//   dark: "#705746",
//   steel: "#B7B7CE",
//   fairy: "#D685AD",
// };

// const PAGE_SIZE = 20;

// function capitalize(value: string) {
//   return value.charAt(0).toUpperCase() + value.slice(1);
// }

// function formatPokemonId(id: number) {
//   return `#${id.toString().padStart(4, "0")}`;
// }

// export default function Index() {
//   const [pokemons, setPokemons] = useState<Pokemon[]>([]);
//   const [page, setPage] = useState(1);
//   const [totalPokemon, setTotalPokemon] = useState(0);

//   const [loading, setLoading] = useState(true);
//   const [pageLoading, setPageLoading] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);

//   const [error, setError] = useState<string | null>(null);

//   const totalPages = useMemo(() => {
//     return Math.ceil(totalPokemon / PAGE_SIZE);
//   }, [totalPokemon]);

//   const fetchPokemons = useCallback(
//     async (
//       targetPage = 1,
//       options?: {
//         refreshing?: boolean;
//       },
//     ) => {
//       const isRefresh = options?.refreshing ?? false;

//       try {
//         setError(null);

//         if (isRefresh) {
//           setRefreshing(true);
//         } else if (targetPage === 1 && pokemons.length === 0) {
//           setLoading(true);
//         } else {
//           setPageLoading(true);
//         }

//         const offset = (targetPage - 1) * PAGE_SIZE;

//         const response = await fetch(
//           `https://pokeapi.co/api/v2/pokemon?limit=${PAGE_SIZE}&offset=${offset}`,
//         );

//         if (!response.ok) {
//           throw new Error("Unable to load Pokémon.");
//         }

//         const data: PokemonListResponse = await response.json();

//         const detailedPokemons = await Promise.all(
//           data.results.map(async (pokemon) => {
//             const detailResponse = await fetch(pokemon.url);

//             if (!detailResponse.ok) {
//               throw new Error(`Unable to load ${pokemon.name}`);
//             }

//             const detailedData = await detailResponse.json();

//             return {
//               id: detailedData.id,
//               name: detailedData.name,
//               imageUrl:
//                 detailedData.sprites?.other?.["official-artwork"]
//                   ?.front_default ??
//                 detailedData.sprites?.other?.home?.front_default ??
//                 detailedData.sprites?.front_default,
//               types: detailedData.types,
//             };
//           }),
//         );

//         setPokemons(detailedPokemons);
//         setTotalPokemon(data.count);
//         setPage(targetPage);
//       } catch (err) {
//         console.error(err);

//         setError(
//           err instanceof Error
//             ? err.message
//             : "Something went wrong while loading the Pokidex.",
//         );
//       } finally {
//         setLoading(false);
//         setPageLoading(false);
//         setRefreshing(false);
//       }
//     },
//     [pokemons.length],
//   );

//   useEffect(() => {
//     fetchPokemons(1);
//   }, []);

//   const handleNextPage = () => {
//     if (page >= totalPages || pageLoading) return;

//     fetchPokemons(page + 1);
//   };

//   const handlePreviousPage = () => {
//     if (page <= 1 || pageLoading) return;

//     fetchPokemons(page - 1);
//   };

//   const handleRefresh = () => {
//     fetchPokemons(page, {
//       refreshing: true,
//     });
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <View style={styles.loadingPokeball}>
//           <ActivityIndicator size="large" color="#FFFFFF" />
//         </View>

//         <Text style={styles.loadingTitle}>Opening Pokidex</Text>

//         <Text style={styles.loadingDescription}>
//           Discovering Pokémon from around the world...
//         </Text>
//       </View>
//     );
//   }

//   if (error && pokemons.length === 0) {
//     return (
//       <View style={styles.errorContainer}>
//         <View style={styles.errorIcon}>
//           <Text style={styles.errorIconText}>!</Text>
//         </View>

//         <Text style={styles.errorTitle}>Pokidex unavailable</Text>

//         <Text style={styles.errorMessage}>{error}</Text>

//         <Pressable
//           onPress={() => fetchPokemons(1)}
//           style={({ pressed }) => [
//             styles.retryButton,
//             pressed && {
//               opacity: 0.8,
//               transform: [{ scale: 0.97 }],
//             },
//           ]}
//         >
//           <Text style={styles.retryButtonText}>Try again</Text>
//         </Pressable>
//       </View>
//     );
//   }

//   return (
//     <FlatList
//       data={pokemons}
//       keyExtractor={(item) => item.id.toString()}
//       numColumns={2}
//       showsVerticalScrollIndicator={false}
//       columnWrapperStyle={styles.columnWrapper}
//       contentContainerStyle={styles.listContent}
//       refreshControl={
//         <RefreshControl
//           refreshing={refreshing}
//           onRefresh={handleRefresh}
//           tintColor="#EF5350"
//         />
//       }
//       ListHeaderComponent={
//         <View>
//           <Hero />

//           <View style={styles.sectionHeader}>
//             <View>
//               <Text style={styles.sectionEyebrow}>EXPLORE</Text>

//               <Text style={styles.sectionTitle}>
//                 Pokémon
//               </Text>
//             </View>

//             <View style={styles.countBadge}>
//               <Text style={styles.countText}>
//                 {totalPokemon.toLocaleString()}
//               </Text>
//             </View>
//           </View>

//           <Text style={styles.sectionDescription}>
//             Choose a Pokémon to view its abilities, stats, habitat, moves and
//             Pokidex information.
//           </Text>
//         </View>
//       }
//       renderItem={({ item }) => (
//         <PokemonCard pokemon={item} />
//       )}
//       ListFooterComponent={
//         <Pagination
//           page={page}
//           totalPages={totalPages}
//           loading={pageLoading}
//           onPrevious={handlePreviousPage}
//           onNext={handleNextPage}
//         />
//       }
//     />
//   );
// }

// function Hero() {
//   return (
//     <View style={styles.hero}>
//       <View style={styles.heroGlowOne} />
//       <View style={styles.heroGlowTwo} />

//       <View style={styles.heroPokeball}>
//         <View style={styles.heroPokeballLine} />

//         <View style={styles.heroPokeballCenter}>
//           <View style={styles.heroPokeballInner} />
//         </View>
//       </View>

//       <View style={styles.heroContent}>
//         <View style={styles.heroBadge}>
//           <View style={styles.heroBadgeDot} />

//           <Text style={styles.heroBadgeText}>
//             Pokidex
//           </Text>
//         </View>

//         <Text style={styles.heroTitle}>
//           Gotta catch{"\n"}
//           <Text style={styles.heroTitleAccent}>
//             ’em all.
//           </Text>
//         </Text>

//         <Text style={styles.heroDescription}>
//           Explore Pokémon, discover their abilities and learn what makes every
//           species unique.
//         </Text>

//         <View style={styles.heroStats}>
//           <View>
//             <Text style={styles.heroStatValue}>
//               1,000+
//             </Text>

//             <Text style={styles.heroStatLabel}>
//               Pokémon
//             </Text>
//           </View>

//           <View style={styles.heroDivider} />

//           <View>
//             <Text style={styles.heroStatValue}>
//               18
//             </Text>

//             <Text style={styles.heroStatLabel}>
//               Types
//             </Text>
//           </View>

//           <View style={styles.heroDivider} />

//           <View>
//             <Text style={styles.heroStatValue}>
//               IX
//             </Text>

//             <Text style={styles.heroStatLabel}>
//               Generations
//             </Text>
//           </View>
//         </View>
//       </View>
//     </View>
//   );
// }

// function PokemonCard({
//   pokemon,
// }: {
//   pokemon: Pokemon;
// }) {
//   const primaryType =
//     pokemon.types[0]?.type.name as keyof typeof colorsByType;

//   const primaryColor =
//     colorsByType[primaryType] ?? colorsByType.normal;

//   return (
//     <Link
//       href={{
//         pathname: "/pokemonDetails",
//         params: {
//           name: pokemon.name,
//         },
//       }}
//       asChild
//     >
//       <Pressable
//         style={({ pressed }) => [
//           styles.card,
//           {
//             backgroundColor: primaryColor,
//           },
//           pressed && styles.cardPressed,
//         ]}
//       >
//         {/* <View style={styles.cardPokeball}>
//           <View style={styles.cardPokeballLine} />

//           <View style={styles.cardPokeballCenter} />
//         </View> */}

//         <View style={styles.cardTop}>
//           <Text style={styles.pokemonNumber}>
//             {formatPokemonId(pokemon.id)}
//           </Text>
//         </View>

//         <Text
//           numberOfLines={1}
//           style={styles.pokemonName}
//         >
//           {capitalize(pokemon.name)}
//         </Text>

//         <View style={styles.typesContainer}>
//           {pokemon.types.map(({ type }) => (
//             <View
//               key={type.name}
//               style={styles.typeBadge}
//             >
//               <View style={styles.typeDot} />

//               <Text style={styles.typeText}>
//                 {capitalize(type.name)}
//               </Text>
//             </View>
//           ))}
//         </View>

//         <View style={styles.imageContainer}>
//           {pokemon.imageUrl ? (
//             <Image
//               source={{
//                 uri: pokemon.imageUrl,
//               }}
//               style={styles.pokemonImage}
//               resizeMode="contain"
//             />
//           ) : (
//             <View style={styles.imageFallback}>
//               <Text style={styles.imageFallbackText}>
//                 ?
//               </Text>
//             </View>
//           )}
//         </View>

//         <View style={styles.cardFooter}>
//           <Text style={styles.viewDetails}>
//             View details
//           </Text>

//           <View style={styles.arrowButton}>
//             <Text style={styles.arrowText}>›</Text>
//           </View>
//         </View>
//       </Pressable>
//     </Link>
//   );
// }


// function Pagination({
//   page,
//   totalPages,
//   loading,
//   onPrevious,
//   onNext,
// }: {
//   page: number;
//   totalPages: number;
//   loading: boolean;
//   onPrevious: () => void;
//   onNext: () => void;
// }) {
//   return (
//     <View style={styles.paginationContainer}>
//       <View style={styles.paginationTop}>
//         <Text style={styles.paginationTitle}>
//           Pokidex pages
//         </Text>

//         <Text style={styles.paginationInfo}>
//           Page {page} of {totalPages}
//         </Text>
//       </View>

//       <View style={styles.paginationControls}>
//         <Pressable
//           disabled={page === 1 || loading}
//           onPress={onPrevious}
//           style={({ pressed }) => [
//             styles.paginationButton,
//             page === 1 && styles.paginationButtonDisabled,
//             pressed &&
//               page !== 1 &&
//               styles.paginationButtonPressed,
//           ]}
//         >
//           <Text
//             style={[
//               styles.paginationButtonText,
//               page === 1 &&
//                 styles.paginationButtonTextDisabled,
//             ]}
//           >
//             ‹ Previous
//           </Text>
//         </Pressable>

//         <View style={styles.currentPage}>
//           {loading ? (
//             <ActivityIndicator
//               size="small"
//               color="#EF5350"
//             />
//           ) : (
//             <Text style={styles.currentPageText}>
//               {page}
//             </Text>
//           )}
//         </View>

//         <Pressable
//           disabled={page >= totalPages || loading}
//           onPress={onNext}
//           style={({ pressed }) => [
//             styles.paginationButton,
//             page >= totalPages &&
//               styles.paginationButtonDisabled,
//             pressed &&
//               page < totalPages &&
//               styles.paginationButtonPressed,
//           ]}
//         >
//           <Text
//             style={[
//               styles.paginationButtonText,
//               page >= totalPages &&
//                 styles.paginationButtonTextDisabled,
//             ]}
//           >
//             Next ›
//           </Text>
//         </Pressable>
//       </View>

//       <Text style={styles.paginationHint}>
//         Showing {(page - 1) * PAGE_SIZE + 1}–
//         {Math.min(page * PAGE_SIZE, totalPages * PAGE_SIZE)}
//       </Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   listContent: {
//     paddingBottom: 45,
//     backgroundColor: "#F7F8FA",
//   },

//   columnWrapper: {
//     paddingHorizontal: 16,
//     gap: 12,
//   },

//   hero: {
//     minHeight: 385,
//     marginBottom: 30,
//     paddingHorizontal: 24,
//     paddingTop: 42,
//     paddingBottom: 32,

//     backgroundColor: "#EF5350",

//     borderBottomLeftRadius: 38,
//     borderBottomRightRadius: 38,

//     overflow: "hidden",

//     position: "relative",
//   },

//   heroContent: {
//     zIndex: 5,
//   },

//   heroGlowOne: {
//     position: "absolute",
//     width: 240,
//     height: 240,

//     borderRadius: 120,

//     backgroundColor: "rgba(255,255,255,0.07)",

//     top: -80,
//     left: -90,
//   },

//   heroGlowTwo: {
//     position: "absolute",
//     width: 190,
//     height: 190,

//     borderRadius: 95,

//     backgroundColor: "rgba(255,255,255,0.05)",

//     bottom: -70,
//     right: 30,
//   },

//   heroBadge: {
//     alignSelf: "flex-start",

//     flexDirection: "row",
//     alignItems: "center",

//     paddingHorizontal: 13,
//     paddingVertical: 8,

//     borderRadius: 100,

//     backgroundColor: "rgba(255,255,255,0.15)",

//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.18)",

//     gap: 7,
//   },

//   heroBadgeDot: {
//     width: 7,
//     height: 7,

//     borderRadius: 4,

//     backgroundColor: "#FFFFFF",
//   },

//   heroBadgeText: {
//     color: "#FFFFFF",

//     fontWeight: "800",

//     fontSize: 12,

//     letterSpacing: 0.4,
//   },

//   heroTitle: {
//     marginTop: 22,

//     color: "#FFFFFF",

//     fontSize: 45,

//     lineHeight: 50,

//     letterSpacing: -2,

//     fontWeight: "900",
//   },

//   heroTitleAccent: {
//     color: "#FFE082",
//   },

//   heroDescription: {
//     color: "rgba(255,255,255,0.82)",

//     maxWidth: 310,

//     marginTop: 14,

//     fontSize: 15,

//     lineHeight: 23,

//     fontWeight: "500",
//   },

//   heroStats: {
//     flexDirection: "row",
//     alignItems: "center",

//     marginTop: 30,

//     gap: 20,
//   },

//   heroStatValue: {
//     color: "#FFFFFF",

//     fontSize: 18,

//     fontWeight: "900",
//   },

//   heroStatLabel: {
//     color: "rgba(255,255,255,0.65)",

//     fontSize: 11,

//     fontWeight: "600",

//     marginTop: 2,
//   },

//   heroDivider: {
//     width: 1,
//     height: 30,

//     backgroundColor: "rgba(255,255,255,0.2)",
//   },

//   heroPokeball: {
//     position: "absolute",

//     width: 250,
//     height: 250,

//     borderRadius: 125,

//     borderWidth: 25,

//     borderColor: "rgba(255,255,255,0.1)",

//     right: -90,
//     bottom: -50,

//     justifyContent: "center",
//     alignItems: "center",

//     transform: [
//       {
//         rotate: "-18deg",
//       },
//     ],
//   },

//   heroPokeballLine: {
//     position: "absolute",

//     width: "100%",
//     height: 25,

//     backgroundColor: "rgba(255,255,255,0.1)",
//   },

//   heroPokeballCenter: {
//     width: 75,
//     height: 75,

//     borderRadius: 40,

//     borderWidth: 20,

//     borderColor: "rgba(255,255,255,0.1)",
//   },

//   heroPokeballInner: {
//     width: 20,
//     height: 20,

//     borderRadius: 10,

//     backgroundColor: "rgba(255,255,255,0.1)",
//   },

//   sectionHeader: {
//     flexDirection: "row",
//     alignItems: "flex-end",
//     justifyContent: "space-between",

//     paddingHorizontal: 18,
//   },

//   sectionEyebrow: {
//     color: "#EF5350",

//     fontWeight: "900",

//     fontSize: 11,

//     letterSpacing: 1.5,

//     marginBottom: 4,
//   },

//   sectionTitle: {
//     color: "#1C1C1E",

//     fontSize: 29,

//     fontWeight: "900",

//     letterSpacing: -1,
//   },

//   countBadge: {
//     minWidth: 62,

//     paddingHorizontal: 12,
//     paddingVertical: 7,

//     borderRadius: 100,

//     backgroundColor: "#FFFFFF",

//     alignItems: "center",

//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 3,
//     },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,

//     elevation: 2,
//   },

//   countText: {
//     color: "#000",

//     fontSize: 12,

//     fontWeight: "800",
//   },

//   sectionDescription: {
//     paddingHorizontal: 18,

//     color: "#8A8A8F",

//     fontSize: 14,

//     lineHeight: 21,

//     marginTop: 8,
//     marginBottom: 18,

//     maxWidth: 390,
//   },

//   card: {
//     flex: 1,
//     alignItems: "flex-end",
//     justifyContent: "space-between",

//     minHeight: 260,

//     padding: 15,

//     marginBottom: 12,

//     borderRadius: 25,

//     overflow: "hidden",

//     position: "relative",

//     shadowColor: "#000",

//     shadowOffset: {
//       width: 0,
//       height: 7,
//     },

//     shadowOpacity: 0.08,

//     shadowRadius: 10,

//     elevation: 4,
//   },

//   cardPressed: {
//     opacity: 0.9,

//     transform: [
//       {
//         scale: 0.97,
//       },
//     ],
//   },

//   cardTop: {
//     flexDirection: "row",
//     justifyContent: "flex-end",
// paddingTop: 20,
//     zIndex: 3,
//   },

//   pokemonNumber: {
//     color: "rgba(10, 10, 10, 0.6)",

//     fontSize: 11,

//     fontWeight: "900",
//   },

//   pokemonName: {
//     color: "#000",

//     fontSize: 20,

//     fontWeight: "900",

//     letterSpacing: -0.5,

//     marginTop: 3,

//     zIndex: 3,
//   },

//   typesContainer: {
//     flexDirection: "row",
//     flexWrap: "wrap",

//     gap: 5,

//     marginTop: 9,

//     zIndex: 5,
//   },

//   typeBadge: {
//     flexDirection: "row",
//     alignItems: "center",
    
//     gap: 4,

//     paddingHorizontal: 8,
//     paddingVertical: 5,

//     borderRadius: 100,

//     backgroundColor: "rgba(24, 22, 22, 0.7)",

//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.15)",
//   },

//   typeDot: {
//     width: 4,
//     height: 4,

//     borderRadius: 2,

//     backgroundColor: "#000",
//   },

//   typeText: {
//     color: "#FFFFFF",

//     fontWeight: "700",

//     fontSize: 9,
//   },

//   imageContainer: {
//      width: "100%",
//     height: 120,

//     alignItems: "center",
//     justifyContent: "center",

//     marginTop: -2,

//     zIndex: 3,
//   },

//   pokemonImage: {
//     width: 130,
//     height: 130,
//   },

//   imageFallback: {
//     width: 90,
//     height: 90,

//     borderRadius: 45,

//     backgroundColor: "rgba(255,255,255,0.15)",

//     justifyContent: "center",
//     alignItems: "center",
//   },

//   imageFallbackText: {
//     color: "#000",

//     fontSize: 35,

//     fontWeight: "900",
//   },

//   cardFooter: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",

//     marginTop: "auto",

//     zIndex: 3,
//   },

//   viewDetails: {
//     color: "rgba(0,0,0,0.8)",

//     fontSize: 10,

//     fontWeight: "700",
//   },

//   arrowButton: {
//     width: 28,
//     height: 28,

//     borderRadius: 14,

//     justifyContent: "center",
//     alignItems: "center",

//     backgroundColor: "rgba(16, 14, 14, 0.2)",
//   },

//   arrowText: {
//     color: "#000",

//     fontSize: 22,

//     lineHeight: 24,

//     marginTop: -2,

//     fontWeight: "600",
//   },
// // the design of the pokeball at the back of the pokemon
//   // cardPokeball: {
//   //   position: "absolute",

//   //   width: 145,
//   //   height: 145,

//   //   borderRadius: 75,

//   //   borderWidth: 14,

//   //   borderColor: "rgba(255,255,255,0.1)",

//   //   right: -42,
//   //   bottom: 24,

//   //   justifyContent: "center",
//   //   alignItems: "center",

//   //   transform: [
//   //     {
//   //       rotate: "-18deg",
//   //     },
//   //   ],
//   // },

//   // cardPokeballLine: {
//   //   position: "absolute",

//   //   width: "100%",
//   //   height: 14,

//   //   backgroundColor: "rgba(255,255,255,0.1)",
//   // },

//   // cardPokeballCenter: {
//   //   width: 45,
//   //   height: 45,

//   //   borderRadius: 23,

//   //   borderWidth: 12,

//   //   borderColor: "rgba(255,255,255,0.1)",
//   // },

//   paginationContainer: {
//     marginHorizontal: 16,
//     marginTop: 16,

//     backgroundColor: "#FFFFFF",

//     borderRadius: 24,

//     padding: 17,

//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },
//     shadowOpacity: 0.05,
//     shadowRadius: 10,

//     elevation: 2,
//   },

//   paginationTop: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",

//     marginBottom: 16,
//   },

//   paginationTitle: {
//     color: "#1D1D1F",

//     fontSize: 15,

//     fontWeight: "900",
//   },

//   paginationInfo: {
//     color: "#96969C",

//     fontSize: 11,

//     fontWeight: "700",
//   },

//   paginationControls: {
//     flexDirection: "row",
//     alignItems: "center",

//     gap: 10,
//   },

//   paginationButton: {
//     flex: 1,

//     paddingVertical: 13,

//     backgroundColor: "#F4F4F6",

//     borderRadius: 14,

//     alignItems: "center",
//   },

//   paginationButtonPressed: {
//     transform: [
//       {
//         scale: 0.97,
//       },
//     ],

//     opacity: 0.8,
//   },

//   paginationButtonDisabled: {
//     opacity: 0.45,
//   },

//   paginationButtonText: {
//     color: "#303034",

//     fontSize: 12,

//     fontWeight: "800",
//   },

//   paginationButtonTextDisabled: {
//     color: "#AAAAAF",
//   },

//   currentPage: {
//     width: 44,
//     height: 44,

//     borderRadius: 14,

//     backgroundColor: "#FFF1F1",

//     justifyContent: "center",
//     alignItems: "center",
//   },

//   currentPageText: {
//     color: "#EF5350",

//     fontSize: 15,

//     fontWeight: "900",
//   },

//   paginationHint: {
//     textAlign: "center",

//     color: "#AAAAAF",

//     fontSize: 10,

//     fontWeight: "600",

//     marginTop: 12,
//   },

//   loadingContainer: {
//     flex: 1,

//     justifyContent: "center",
//     alignItems: "center",

//     paddingHorizontal: 30,

//     backgroundColor: "#EF5350",
//   },

//   loadingPokeball: {
//     width: 85,
//     height: 85,

//     borderRadius: 43,

//     backgroundColor: "rgba(255,255,255,0.16)",

//     justifyContent: "center",
//     alignItems: "center",

//     marginBottom: 20,
//   },

//   loadingTitle: {
//     color: "#FFFFFF",

//     fontSize: 24,

//     fontWeight: "900",
//   },

//   loadingDescription: {
//     color: "rgba(255,255,255,0.72)",

//     fontSize: 13,

//     textAlign: "center",

//     marginTop: 7,
//   },

//   errorContainer: {
//     flex: 1,

//     justifyContent: "center",
//     alignItems: "center",

//     paddingHorizontal: 30,

//     backgroundColor: "#F7F8FA",
//   },

//   errorIcon: {
//     width: 70,
//     height: 70,

//     borderRadius: 35,

//     backgroundColor: "#FFE7E7",

//     justifyContent: "center",
//     alignItems: "center",

//     marginBottom: 18,
//   },

//   errorIconText: {
//     color: "#EF5350",

//     fontSize: 30,

//     fontWeight: "900",
//   },

//   errorTitle: {
//     color: "#242427",

//     fontSize: 21,

//     fontWeight: "900",
//   },

//   errorMessage: {
//     color: "#8D8D92",

//     fontSize: 13,

//     lineHeight: 20,

//     textAlign: "center",

//     marginTop: 7,
//   },

//   retryButton: {
//     marginTop: 20,

//     paddingHorizontal: 25,
//     paddingVertical: 13,

//     borderRadius: 14,

//     backgroundColor: "#EF5350",
//   },

//   retryButtonText: {
//     color: "#FFFFFF",

//     fontSize: 13,

//     fontWeight: "800",
//   },
// });




// import { useEffect, useState } from "react";
// import {
//   Image,
//   Text,
//   View,
//   StyleSheet,
//   ScrollView,
//   Pressable,
// } from "react-native";
// import { Link } from "expo-router";

// interface Pokemon {
//   name: string;
//   // url: string;
//   imageUrl: string;
//   imageBack: string;
//   types: DetailedType[];
// }

// interface TypeRef {
//   name: string;
//   url: string;
// }

// interface DetailedType {
//   slot: number;
//   type: TypeRef;
// }

// const colorsByType = {
//   normal: "#A8A77A",
//   fire: "#EE8130",
//   water: "#6390F0",
//   electric: "#F7D02C",
//   grass: "#7AC74C",
//   ice: "#96D9D6",
//   fighting: "#C22E28",
//   poison: "#A33EA1",
//   ground: "#E2BF65",
//   flying: "#A98FF3",
//   psychic: "#F95587",
//   bug: "#A6B91A",
//   rock: "#B6A136",
//   ghost: "#735797",
//   dragon: "#6F35FC",
//   dark: "#705746",
//   steel: "#B7B7CE",
//   fairy: "#D685AD",
// };

// export default function Index() {
//   const [pokemons, setPokemons] = useState<Pokemon[]>([]);

//   useEffect(() => {
//     fetchPokemons();
//   }, []);

//   async function fetchPokemons() {
//     try {
//       const response = await fetch(
//         "https://pokeapi.co/api/v2/pokemon?limit=100",
//       );
//       const data = await response.json();

//       const detailedPokemons = await Promise.all(
//         data.results.map(async (pokemon: any) => {
//           const response = await fetch(pokemon.url);
//           const detailedData = await response.json();
//           return {
//             name: detailedData.name,
//             imageUrl: detailedData.sprites.front_default, // You can change this to any other property you want to display
//             imageBack: detailedData.sprites.back_default, // You can change this to any other property you want to display
//             types: detailedData.types, // Extracting types
//           };
//         }),
//       );

//       setPokemons(detailedPokemons);
//     } catch (error) {
//       console.error(error);
//     }
//   }

//   return (
//     <ScrollView
//       contentContainerStyle={{
//         flexGrow: 1,
//         justifyContent: "center",
//         alignItems: "center",
//         gap: 16,
//         padding: 16,
//       }}
//     >
//       {pokemons.map((pokemon) => (
//         <Link key={pokemon.name} href={{ pathname: "/pokemonDetails", params: { name: pokemon.name } }}>
//           <View
//             style={[
//               styles.container,
//               {
//                 backgroundColor:
//                   colorsByType[
//                     (pokemon.types[0].type.name as keyof typeof colorsByType) ||
//                       "normal"
//                   ] + 50,
//               },
//             ]}
//           >
//             <Text style={styles.name}>{pokemon.name}</Text>
//             <Text style={styles.type}>{pokemon.types[0].type.name}</Text>
//             <View
//               style={{ flexDirection: "row", justifyContent: "space-between" }}
//             >
//               <Image
//                 source={{ uri: pokemon.imageUrl }}
//                 style={{ width: 150, height: 150 }}
//               />
//               <Image
//                 source={{ uri: pokemon.imageBack }}
//                 style={{ width: 150, height: 150 }}
//               />
//             </View>
//           </View>
//         </Link>
//       ))}
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 26,
//     borderRadius: 20,
//     // cursor: "pointer",
//     // backgroundColor is set dynamically per-item inline where the component is rendered
//   },
//   name: {
//     fontSize: 20,
//     fontWeight: "bold",
//   },
//   type: {
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "grey",
//   },
// });
