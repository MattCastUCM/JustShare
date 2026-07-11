from typing import Optional

# # Es el costo mínimo de convertir los primeros i caracteres de la cadena s en los primeros j caracteres de la cadena t
# @lru_cache(maxsize=100_000)
# def damerau_levenshtein(s: str, t: str):
# 	m, n = len(s), len(t)

# 	# Existe un primer caso en el que las cadenas están vacías
# 	dp = [[0] * (n + 1) for _ in range(m + 1)]

# 	for i in range(m + 1):
# 		dp[i][0] = i

# 	for j in range(n + 1):
# 		dp[0][j] = j

# 	for i in range(1, m + 1):
# 		for j in range(1, n + 1):

# 			cost = 0 if s[i - 1] == t[j - 1] else 1

# 			dp[i][j] = min(
# 				# Eliminación
# 				# s = "cat"
# 				# t = "ca" 
# 				dp[i - 1][j] + 1,
# 				# Inserción
# 				# s = "ca"
# 				# t = "cat"
# 				dp[i][j - 1] + 1,
# 				# Sustitución
# 				# s = "cat"
# 				# t = "cut"
# 				dp[i - 1][j - 1] + cost
# 			)
			
# 			# Trasposición
# 			# s = "CA"
# 			# t = "AC"
# 			# Si no hubiera trasposición, costaría 2
# 			if (
# 				i > 1 and j > 1
# 				and s[i - 1] == t[j - 2]
# 				and s[i - 2] == t[j - 1]
# 			):
# 				dp[i][j] = min(
# 					dp[i][j],
# 					dp[i - 2][j - 2] + 1
# 				)

# 	return dp[m][n]

def damerau_levenshtein(word1: str, word2: str, max_dist: Optional[int] = None):
	# Intercambiar para que word1 sea siempre la cadena más larga
	if len(word1) < len(word2):
		word1, word2 = word2, word1

	len1, len2 = len(word1), len(word2)

	# Salida anticipada para SymSpell. Si la diferencia entre las longitudes de las cadenas es mayor que la distancia máxima, no será posible convertir una en otra con esa distancia dada.
	# No se puede utilizar con el BKTree porque necesita la distancia exacta para explorar el árbol
	if max_dist is not None and abs(len1 - len2) > max_dist:
		return max_dist + 1

	prev1 = list(range(len2 + 1))
	prev2 = list(range(len2 + 1))

	for i in range(1, len1 + 1):
		# Existe un primer caso en el que las cadenas están vacías
		curr = [0] * (len2 + 1)
		curr[0] = i
		min_in_row = i

		for j in range(1, len2 + 1):
			cost = 0 if word1[i - 1] == word2[j - 1] else 1

			curr[j] = min(
				# Eliminación
				# s = "cat"
				# t = "ca" 
				prev1[j] + 1,
				# Inserción
				# s = "ca"
				# t = "cat"
				curr[j - 1] + 1,
				# Sustitución
				# s = "cat"
				# t = "cut"
				prev1[j - 1] + cost
			)
			
			# Trasposición (Damerau)
			# s = "CA"
			# t = "AC"
			# Si no hubiera trasposición, costaría 2
			if i > 1 and j > 1 and word1[i - 1] == word2[j - 2] and word1[i - 2] == word2[j - 1]:
				curr[j] = min(
					curr[j],
					prev2[j - 2] + 1
				)
			
			min_in_row = min(min_in_row, curr[j])

		if max_dist is not None and min_in_row > max_dist:
			return max_dist + 1

		prev2, prev1 = prev1, curr

	return prev1[len2]

def char_ngrams(word: str, n: int = 2):
	return {word[i:i+n] for i in range(len(word)-n+1)}

def jaccard_distance(word1: str, word2: str, n: int = 2):
	set1 = char_ngrams(word1, n)
	set2 = char_ngrams(word2, n)
	intersection = len(set1 & set2)
	union = len(set1 | set2)
	if union == 0:
		return 0
	return intersection / union
