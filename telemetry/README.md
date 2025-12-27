# Instrucciones de Trabajo

A continuación se detallan los pasos a seguir para realizar las mezclas y organizar el código correctamente:

---

### 1. Trabajar en un archivo Jupyter Notebook independiente

- **Copia los cambios actuales** en un **nuevo archivo Jupyter Notebook**. Esto permite trabajar de manera aislada y realizar modificaciones sin riesgo de entrar en conflicto si alguien más realiza cambios en el código.

### 2. Copiar cambios a main.ipynb
- **Copia los cambios realizados** en **una única celda** dentro de `main.ipynb`.
- De manera similar, copia los cambios efectuados en los archivos auxiliares y colócalos en sus correspondientes archivos `.py`.
- Ejecuta todas las mezclas necesarias y comprueba que todo funciona correctamente.

### 3. Transferencia a `main.py`
- Una vez completada la integración, **copia el contenido resultante** de `main.ipynb` a `main.py`.
- Esto facilita la resolución de posibles conflictos, ya que trabajar con Jupyter Notebook no siempre es tan sencillo para el control de versiones.

### 4. Organización del código
- Asegúrate de que cada parte del código esté colocada en su **sección correspondiente**.
- Las **funciones recurrentes** deben colocarse en los archivos de **uso común**, de manera que puedan ser fácilmente reutilizadas.

### 5. Comentarios y salida en consola
- En los **comentarios**, indica el apartado y la pregunta a responder.
- Asegúrate de mostrar las **métricas** utilizando la función común `show_metric` de `utils.py`.

### Notas importantes
> Trata de reutilizar siempre los métodos auxiliares que se encuentran en archivos distintos al principal (`main.py`).

> Puedes alternar entre las trazas de **Scorm Cloud** y **Simva** cambiando el valor de la variable `useScorm` en `main.py`.

---

💡 **Consejo**: Mantén el código limpio y asegura que los métodos comunes estén bien comentados para facilitar su reutilización.
