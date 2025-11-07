import React, { useState } from "react";
import { View, Platform, KeyboardAvoidingView, FlatList } from "react-native";
import {
  Appbar,
  Card,
  TextInput,
  Button,
  HelperText,
  Snackbar,
} from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import { addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { userCol } from "../firebase";

export default function ProductFormScreen() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [weight, setWeight] = useState("");
  const [batch, setBatch] = useState("");
  const [quantity, setQuantity] = useState("");
  const [code, setCode] = useState("");
  const [expiry, setExpiry] = useState(undefined);
  const [showDate, setShowDate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState(null);

  const isQtyValid = Number(quantity) > 0;
  const isExpiryValid = !expiry || expiry > new Date();
  const isPriceValid = Number(price) >= 0;

  const onSave = async () => {
    if (!name || !isQtyValid || !isExpiryValid || !isPriceValid) {
      setSnack("Verifique os campos obrigatórios e a validade.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        price: Number(price),
        weight: weight ? Number(weight) : null,
        batch: batch || undefined,
        quantity: Number(quantity),
        code: code || undefined,
        expiry: expiry ? Timestamp.fromDate(expiry) : null,
        createdAt: serverTimestamp(),
      };
      await addDoc(userCol("products"), payload);
      setSnack("Produto salvo!");
      setName("");
      setPrice("");
      setWeight("");
      setBatch("");
      setQuantity("");
      setCode("");
      setExpiry(undefined);
    } catch (e) {
      setSnack("Erro ao salvar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={{ flex: 1 }}
    >
      <Appbar.Header>
        <Appbar.Content title="Produtos" subtitle="Cadastro e estoque" />
      </Appbar.Header>

      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={[1]}
        renderItem={() => (
          <Card>
            <Card.Content>
              <TextInput
                label="Nome"
                value={name}
                onChangeText={setName}
                style={{ marginBottom: 12 }}
              />

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TextInput
                  label="Preço (R$)"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                  style={{ flex: 1 }}
                />
                <TextInput
                  label="Peso (opcional)"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                  style={{ flex: 1 }}
                />
              </View>
              <HelperText type={isPriceValid ? "info" : "error"} visible>
                {isPriceValid
                  ? "Preço pode ser 0 para amostras"
                  : "Preço inválido"}
              </HelperText>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TextInput
                  label="Lote"
                  value={batch}
                  onChangeText={setBatch}
                  style={{ flex: 1 }}
                />
                <TextInput
                  label="Quantidade"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="number-pad"
                  style={{ flex: 1 }}
                />
              </View>
              <HelperText type={isQtyValid ? "info" : "error"} visible>
                {isQtyValid ? "OK" : "Quantidade deve ser maior que 0"}
              </HelperText>

              <View
                style={{ flexDirection: "row", gap: 12, alignItems: "center" }}
              >
                <TextInput
                  label="Validade"
                  value={expiry ? expiry.toLocaleDateString("pt-BR") : ""}
                  onFocus={() => setShowDate(true)}
                  right={
                    <TextInput.Icon
                      icon="calendar"
                      onPress={() => setShowDate(true)}
                    />
                  }
                  style={{ flex: 1 }}
                />
                <TextInput
                  label="Código (EAN/QR/SKU)"
                  value={code}
                  onChangeText={setCode}
                  style={{ flex: 1 }}
                />
              </View>
              <HelperText type={isExpiryValid ? "info" : "error"} visible>
                {isExpiryValid ? "Opcional" : "A validade deve ser futura"}
              </HelperText>

              {showDate && (
                <DateTimePicker
                  value={expiry || new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(e, d) => {
                    setShowDate(Platform.OS === "ios");
                    if (d) setExpiry(d);
                  }}
                />
              )}

              <Button
                mode="contained"
                icon="content-save"
                onPress={onSave}
                loading={saving}
              >
                Salvar produto
              </Button>
            </Card.Content>
          </Card>
        )}
      />

      <Snackbar
        visible={!!snack}
        onDismiss={() => setSnack(null)}
        duration={2500}
      >
        {snack}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}
