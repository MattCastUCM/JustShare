from keras.optimizers import Adam
from keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from keras import Model, metrics

def compile_model(model: Model):
    # optimizer = Adadelta(learning_rate=1.0, clipnorm=1.0)
    optimizer = Adam(learning_rate=1e-3, clipnorm=1.0)

    model.compile(
        optimizer=optimizer,
        loss="mse",
        metrics=["mae", metrics.RootMeanSquaredError(name="rmse")]
    )

    return model

def get_callbacks(save_path: str):
    callbacks = [
        EarlyStopping(
            monitor="val_loss",
            patience=5,
            restore_best_weights=True,
        ),
        ModelCheckpoint(
            filepath=save_path,
            monitor="val_loss",
            save_best_only=True,
        ),
        ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=3,
            min_lr=1e-6,
        )
    ]
    return callbacks
    