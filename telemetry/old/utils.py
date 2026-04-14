import pandas as pd
import numpy as np

# Dada una serie de condiciones (por ejemplo, objeto de tipo Game) obtener sus indices en el dataframe
def find_indices_by_conditions(df, conditions):
	mask = pd.Series([True] * len(df), index=df.index)
	for col, val in conditions:
		if val=="notna":
			mask &= df[col].notna()
		else:
			mask &= df[col] == val
	return df[mask].index.tolist()


# Dada una serie de condiciones (por ejemplo, objeto de tipo Game) obtener el primer indice en el dataframe
def find_first_index_by_conditions(df, conditions,index=0):
	indices = find_indices_by_conditions(df.iloc[index:], conditions)
	return indices[0] if indices else None


def find_values_by_conditions(df, conditions, target_column):
	mask = pd.Series([True] * len(df), index=df.index)
	for col, val in conditions:
		if val == "notna":
			mask &= df[col].notna()
		else:
			mask &= df[col] == val
	return df.loc[mask, target_column].tolist()


# Devuelve el valor de una columna específica en la primera fila que cumple las condiciones
def find_first_value_by_conditions(df, conditions, target_column):
	values = find_values_by_conditions(df, conditions, target_column)
	return values[0] if values else None


# Dado dos indices obtener la diferencia de tiempos
def time_between_indices(df, index1, index2):
	t1 = pd.to_datetime(df.loc[index1, "timestamp"])
	t2 = pd.to_datetime(df.loc[index2, "timestamp"])
	delta = t2 - t1
	return abs(delta.total_seconds()) 


def show_metric(section, title, info = None):
	N_SEPARATORS = 10
	print("#"*N_SEPARATORS)
	print(f"APARTADO {section}")
	print(f"{title}:")
	if info:
		print(str(info))
	print("#"*N_SEPARATORS + "\n")



def find_outliers(data,n=1.5,p1=25,p2=75):
	# Calculate quartiles
	Q1 = np.percentile(data, p1)
	Q3 = np.percentile(data, p2)
	IQR = Q3 - Q1

	# Calculate limits
	lower_limit = Q1 - n * IQR
	upper_limit = Q3 + n * IQR

	# Find outliers
	outliers = [x for x in data if x < lower_limit or x > upper_limit]

	return {
		"Q1": Q1,
		"Q3": Q3,
		"IQR": IQR,
		"lower_limit": lower_limit,
		"upper_limit": upper_limit,
		"outliers": outliers
	}