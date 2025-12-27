import os
import pandas as pd
import json

# Formatear un archivo de trazas generado por simva 
# (se generan en formato json, pero cada traza viene como un objeto por separado, cada uno en una linea,
# y ninguna traza esta separada entre si con comas, ademas de que los objetos no estan dentro de un array)
def format_simva(file):
	lines = []
	
	# Se leen todas las lineas en formato json y se van guardando en la lista
	for line in file:
		lines.append(json.loads(line.strip()))
	
	# Se devuelve la lista con todas las lineas
	return lines


# Obtener la ultima parte de una URI (que determina el tipo)
def get_last_value_uri(value):
	if isinstance(value, str) and "/" in value:
		return value.rsplit("/", 1)[-1]
	else: 
		return value


# Separar un dataset en varios dependiendo de los valores unicos de la columna indicada
# Se usa para obtener por individual los datasets de cada usuario
def split_by_column_values(df, column):
	df_list = []
	
	unique_values = df[column].unique() 
	
	for value in unique_values:
		value_df = df.loc[df[column] == value]
		value_df = value_df.reset_index(drop=True)
		df_list.append(value_df)
		
	return df_list


# Encontrar todos los eventos de un objeto dentro de un primer verbo y un ultimo verbo
# Se usa para obtener todos los eventos que se ejecutan en una sesion
def get_events_between_closest_values(df, column, first, last):
	# Buscar el primer y ultimo indice de la fila
	start_idx = df.index[df[column] == first]

	events = pd.DataFrame()

	if (len(start_idx) > 0):
		start_idx = start_idx[-1]
		end_idx = df.index[(df.index > start_idx) & (df[column] == last)]
		
		if (len(end_idx) > 0):
			end_idx = end_idx[0]
			# Obtener el dataframe entre ambos indices
			if end_idx > start_idx:
				events = df.loc[start_idx:end_idx]
				events = events.reset_index(drop=True)

	return events


# Cargar en un dataframe todos los archivos de un formato especifico del directorio
def load_all_files(path, extension = "json", column_to_sort_by = "eventId", drop_cols = [], use_scorm = True, split_by_column = "actor.account.name"):
	all_users_df = pd.DataFrame()
	users_individual_df_list = []

	# Recorrer todos los archivos del directorio
	for file_name in os.listdir(path):
		# Si el archivo tiene la extension indicada
		if (file_name.endswith(extension)):
			file_df = pd.DataFrame()	

			# Intenta leer el archivo. Si hay algun error, el dataframe estara vacio
			try:
				if (extension == "json"):
					with open(path + file_name, encoding='utf-8') as f:
						file = ""
						# Cargar json
						if not use_scorm:
							file = format_simva(f)
						else:
							file = json.load(f)

						file_df = pd.json_normalize(file)

						# Eliminar columnas que no se van a usar
						file_df = file_df.drop(columns=drop_cols)

						# Quedarse solo con la ultima palabra de las uris (tanto en los titulos de las columnas como el los valores de las mismas)
						for column in file_df.columns:
							file_df[column] = file_df[column].map(get_last_value_uri)
							file_df = file_df.rename(columns={column: get_last_value_uri(column)})
					
			except:
				print("Error reading file")
				pass


			# Si el dataframe no esta vacio (ha cargado el archivo correctamente)
			if (not file_df.empty):
				file_df = file_df.drop_duplicates()

				users_dfs = split_by_column_values(file_df, split_by_column)
				
				for user_df in users_dfs:
					# Se intenta convertir el timestamp a formato UNIX epoch
					try: 
						user_df["timestamp"] = pd.to_datetime(user_df["timestamp"])
					except:
						pass

					# Se ordenan los eventos (por defecto por eventId)
					user_df = user_df.sort_values(by=[column_to_sort_by], ignore_index=True)
					user_df = user_df.reset_index(drop=True)

					# Se busca el dataset que abarque ultimo inicio de sesion y el primer fin de sesion
					file_df = get_events_between_closest_values(user_df, "object.id", "SessionStart", "SessionEnd")

					# Si el dataframe no esta vacio (ha encontrado un inicio y fin de sesion)
					if not file_df.empty:
						# Se agrega el dataset del usuario a la lista con cada dataset
						users_individual_df_list.append(file_df)
						# Se agrega el dataset del usuario al dataset de todos los usuarios
						all_users_df = pd.concat([all_users_df, file_df], ignore_index=True)
						
	return all_users_df, users_individual_df_list

def create_output_directory(path):
	if not os.path.exists(path):
		os.makedirs(path)


def load_surveys(path, extension = "json", drop_cols = []):
	all_df = pd.DataFrame()

	# Recorrer todos los archivos del directorio
	for file_name in os.listdir(path):
		# Si el archivo tiene la extension indicada
		if (file_name.endswith(extension)):
			file_df = pd.DataFrame()	

			# Intenta leer el archivo. Si hay algun error, el dataframe estara vacio
			try:
				if (extension == "json"):
					with open(path + file_name, encoding='utf-8') as f:
						file = json.load(f)
						answers = [value for value in file.values()]

						for answer in answers:
							if answer != None:
								file_df = pd.concat([file_df, pd.DataFrame.from_dict([answer])], ignore_index=True)

			except:
				print("Error reading file")
				pass

			# Si el dataframe esta vacio
			if (not file_df.empty):
				# Eliminar columnas que no se van a usar
				file_df = file_df.drop(columns=drop_cols)

				all_df = pd.concat([all_df, file_df], ignore_index=True)
	
	return all_df