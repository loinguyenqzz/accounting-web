<script setup>
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { VDataTable } from "vuetify/labs/VDataTable";
import { computed, ref, watch } from "vue";
import { db } from "./firebaseConfig";
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
import "vuetify/dist/vuetify.css";
import moment from "moment";

const users = ref([]);
const isShowDialog = ref(false);
const payer = ref("");
const payAmount = ref(null);
const payDate = ref(new Date());
const affectedPerson = ref([]);
const dialogDelete = ref(false);
const note = ref("");
const accountingCol = collection(db, "Accounting");
const items = ref([]);
const itemDelete = ref(null);
const isEditMode = ref(false);
const itemEditId = ref(null);
const currentWeek = ref({
  displayText: `Tuần ${moment().isoWeek()}`,
  value: moment().isoWeek(),
});
const allData = ref([]);

const result = computed(() => {
  let balances = {};
  items.value.forEach((item) => {
    let { payerName, payAmount, affectedPerson } = item;
    payAmount = parseInt(payAmount);

    if (!balances[payerName]) {
      balances[payerName] = {};
    }
    affectedPerson.forEach((person) => {
      if (!balances[person]) {
        balances[person] = {};
      }
      if (!balances[payerName][person]) {
        balances[payerName][person] = 0;
      }
      if (!balances[person][payerName]) {
        balances[person][payerName] = 0;
      }

      balances[person][payerName] += payAmount / affectedPerson.length;
      balances[payerName][person] -= payAmount / affectedPerson.length;
    });
  });

  return balances;
});

const rules = {
  required: (value) => !!value || "Bắt buộc nhập",
};

const headers = [
  {
    title: "Ngày",
    key: "payDate",
    sortable: false,
  },
  {
    title: "Người chi",
    key: "payerName",
  },
  {
    title: "Tiền",
    key: "payAmount",
  },
  {
    title: "",
    key: "actions",
    sortable: false,
    padding: 0,
    class: "v-data-table-column--no-padding",
  },
  { title: "", key: "data-table-expand" },
];

const getUsers = async () => {
  const querySnapshot = await getDocs(collection(db, "User"));
  querySnapshot.forEach((doc) => {
    // Dữ liệu người dùng được trả về từ mỗi tài liệu
    users.value.push(doc.data().name);
  });
  affectedPerson.value = [...users.value];
};

const getData = async () => {
  const data = [];
  const querySnapshot = await getDocs(accountingCol);
  querySnapshot.forEach((doc) => {
    data.push({
      id: doc.id,
      ...doc.data(),
    });
  });
  allData.value = [...data];
};

const editItem = (item) => {
  isEditMode.value = true;
  itemEditId.value = item.id;
  isShowDialog.value = true;
  note.value = item.note;
  affectedPerson.value = item.affectedPerson;
  payAmount.value = item.payAmount;
  payDate.value = moment.unix(item.payDate.seconds).toDate();
  payer.value = item.payerName;
};

const showConfirmDelete = (item) => {
  itemDelete.value = item;
  dialogDelete.value = true;
};

const handleDeleteItem = async () => {
  if (itemDelete.value) {
    await deleteDoc(doc(db, "Accounting", itemDelete.value.id));
    getData();
    dialogDelete.value = false;
  }
};

const handleSave = async () => {
  if (!payer.value || !payAmount.value) return;
  if (isEditMode.value) {
    await setDoc(doc(db, "Accounting", itemEditId.value), {
      payDate: payDate.value,
      payerName: payer.value,
      payAmount: payAmount.value,
      affectedPerson: affectedPerson.value,
      note: note.value,
    });
    isEditMode.value = false;
  } else {
    await addDoc(accountingCol, {
      payDate: payDate.value,
      payerName: payer.value,
      payAmount: payAmount.value,
      affectedPerson: affectedPerson.value,
      note: note.value,
    });
  }
  isShowDialog.value = false;
  getData();
};

const getAllWeeksOfYear = () => {
  const totalWeeks = moment().isoWeeksInYear();

  const weeks = [];
  for (let i = 1; i <= totalWeeks; i++) {
    weeks.push({
      displayText: "Tuần " + i,
      value: i,
    });
  }

  return weeks;
};

watch([currentWeek, allData], () => {
  console.log(currentWeek.value.value);
  items.value = allData.value.filter((data) => {
    const time = data.payDate.seconds;
    return currentWeek.value.value == moment.unix(time).isoWeek();
  });
});
getUsers();
getData();
</script>

<template>
  <v-data-table
    :headers="headers"
    :items="items"
    :sort-by="[{ key: 'payDate', order: 'asc' }]"
    show-expand
  >
    <template v-slot:top>
      <v-toolbar flat>
        <v-toolbar-title>
          <v-combobox
            v-model="currentWeek"
            :items="getAllWeeksOfYear()"
            item-title="displayText"
            item-value="value"
            variant="solo-inverted"
          ></v-combobox>
        </v-toolbar-title>
        <v-divider class="mx-4" inset vertical></v-divider>
        <v-spacer></v-spacer>
        <v-dialog v-model="isShowDialog" max-width="500px">
          <template v-slot:activator="{ props }">
            <v-btn color="primary" dark class="mb-2" v-bind="props">
              Thêm mới
            </v-btn>
          </template>
          <v-card>
            <v-card-title>
              <span class="text-h5">{{ isEditMode ? "Sửa" : "Thêm" }}</span>
            </v-card-title>
            <v-card>
              <v-card-item>
                <VueDatePicker
                  class="date-picker"
                  v-model="payDate"
                ></VueDatePicker>
                <v-select
                  v-model="payer"
                  :items="users"
                  label="Người chi"
                ></v-select>
                <v-select
                  v-model="affectedPerson"
                  :items="users"
                  label="Người ảnh hưởng"
                  multiple
                ></v-select>
                <v-text-field
                  :rules="[rules.required]"
                  v-model="payAmount"
                  label="Số tiền (Đơn vị nghìn đồng)"
                  type="number"
                  placeholder="Ví dụ: 50, 100, 200"
                ></v-text-field>
                <v-textarea v-model="note" label="Ghi chú"></v-textarea>
              </v-card-item>

              <v-card-actions class="d-flex justify-end">
                <v-btn variant="outlined" @click="isShowDialog = false"
                  >Hủy</v-btn
                >
                <v-btn
                  class="m-0"
                  variant="elevated"
                  color="primary"
                  @click="handleSave"
                  >Lưu
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-card>
        </v-dialog>
        <v-dialog v-model="dialogDelete" max-width="500px">
          <v-card>
            <v-card-title class="text-h5">Có chắc chắn xóa không?</v-card-title>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                color="blue-darken-1"
                variant="text"
                @click="dialogDelete = false"
                >Hủy</v-btn
              >
              <v-btn
                color="blue-darken-1"
                variant="text"
                @click="handleDeleteItem"
                >Đồng ý</v-btn
              >
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-toolbar>
    </template>
    <template v-slot:[`item.payDate`]="{ item }">
      {{ moment.unix(item.raw.payDate.seconds).format("DD/MM") }}
    </template>
    <template v-slot:[`item.actions`]="{ item }">
      <v-icon size="default" class="mr-2" @click="editItem(item.raw)">
        mdi-pencil
      </v-icon>
      <v-icon size="default" @click="showConfirmDelete(item.raw)">
        mdi-delete
      </v-icon>
    </template>
    <template v-slot:no-data> Không có dữ liệu </template>
    <template v-slot:expanded-row="{ columns, item }">
      <tr>
        <td :colspan="columns.length">
          Người ảnh hưởng: {{ item.raw.affectedPerson.toString() }}
          <div v-if="item.raw.note">Ghi chú: {{ item.raw.note }}</div>
        </td>
      </tr>
    </template>
  </v-data-table>
  <h3>Kết quả</h3>
  <div v-for="(user, index) in users" :key="index" class="result">
    <v-chip class="chip">{{ user }}</v-chip>
    <div v-for="(userChild, index) in users" :key="index">
      <div
        v-if="userChild != user && result[user] && result[user][userChild]"
        class="result-item"
      >
        {{ `${userChild} : ${parseInt(result[user][userChild])}` }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.date-picker {
  margin-bottom: 16px;
}

:deep(.v-table__wrapper) {
  td,
  th {
    padding: 0 4px !important;
  }
}

.result {
  display: flex;
  flex-wrap: wrap;
  margin: 8px 0;

  &-item {
    margin-left: 12px;
    width: 90px;
  }
}

.chip {
  width: 60px;
}
</style>
