<template>
  <div>
    <el-card class="mb-4">
      <div class="flex justify-between items-center">
        <div class="flex gap-4">
          <el-input
            v-model="searchQuery"
            placeholder="搜索用户昵称/手机号"
            clearable
            style="width: 250px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <el-select v-model="filterType" placeholder="用户类型" clearable style="width: 120px">
            <el-option label="试用用户" value="TRIAL" />
            <el-option label="正式用户" value="FORMAL" />
          </el-select>
          
          <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 120px">
            <el-option label="正常" value="ACTIVE" />
            <el-option label="已过期" value="EXPIRED" />
            <el-option label="已禁用" value="DISABLED" />
          </el-select>
          
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetFilter">重置</el-button>
        </div>
        
        <el-button type="success" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增用户
        </el-button>
      </div>
    </el-card>

    <el-card>
      <el-table :data="userList" v-loading="loading" stripe>
        <el-table-column type="index" width="50" />
        <el-table-column label="用户信息" min-width="200">
          <template #default="{ row }">
            <div class="flex items-center">
              <el-avatar :size="40" :src="row.avatar" />
              <div class="ml-3">
                <div class="font-medium">{{ row.nickname }}</div>
                <div class="text-gray-400 text-sm">{{ row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.userType === 'TRIAL' ? 'info' : 'success'">
              {{ row.userType === 'TRIAL' ? '试用' : '正式' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="到期时间" width="180">
          <template #default="{ row }">
            <div v-if="row.userType === 'TRIAL'">
              {{ formatDate(row.trialEndAt) }}
              <el-tag v-if="isExpiringSoon(row.trialEndAt)" type="danger" size="small" class="ml-2">
                即将到期
              </el-tag>
            </div>
            <div v-else>
              {{ formatDate(row.formalEndAt) }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="房间/租客" width="120">
          <template #default="{ row }">
            {{ row.roomCount }} / {{ row.tenantCount }}
          </template>
        </el-table-column>
        
        <el-table-column label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="success" size="small" @click="handleRenew(row)">
              续费
            </el-button>
            <el-button 
              :type="row.status === 'DISABLED' ? 'success' : 'warning'" 
              size="small"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'DISABLED' ? '启用' : '禁用' }}
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="用户类型" prop="userType">
          <el-radio-group v-model="form.userType">
            <el-radio label="TRIAL">试用</el-radio>
            <el-radio label="FORMAL">正式</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="ACTIVE">正常</el-radio>
            <el-radio label="DISABLED">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 续费对话框 -->
    <el-dialog
      v-model="renewDialogVisible"
      title="用户续费"
      width="400px"
    >
      <div v-if="currentUser" class="mb-4">
        <p><strong>用户：</strong>{{ currentUser.nickname }}</p>
        <p><strong>当前类型：</strong>{{ currentUser.userType === 'TRIAL' ? '试用' : '正式' }}</p>
        <p v-if="currentUser.userType === 'TRIAL'">
          <strong>试用到期：</strong>{{ formatDate(currentUser.trialEndAt) }}
        </p>
        <p v-else>
          <strong>正式到期：</strong>{{ formatDate(currentUser.formalEndAt) }}
        </p>
      </div>
      <el-form :model="renewForm" label-width="80px">
        <el-form-item label="续费时长">
          <el-radio-group v-model="renewForm.duration">
            <el-radio-button :label="1">1个月</el-radio-button>
            <el-radio-button :label="3">3个月</el-radio-button>
            <el-radio-button :label="6">6个月</el-radio-button>
            <el-radio-button :label="12">1年</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="renewForm.amount" :min="0" :precision="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renewDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRenewSubmit" :loading="renewLoading">
          确认续费
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Search, Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import dayjs from 'dayjs'

const { $api } = useNuxtApp()

const loading = ref(false)
const userList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const searchQuery = ref('')
const filterType = ref('')
const filterStatus = ref('')

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const submitLoading = ref(false)

const form = reactive({
  id: null as number | null,
  nickname: '',
  phone: '',
  userType: 'TRIAL',
  status: 'ACTIVE',
  remark: '',
})

const formRules: FormRules = {
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
}

const renewDialogVisible = ref(false)
const renewLoading = ref(false)
const currentUser = ref<any>(null)
const renewForm = reactive({
  duration: 12,
  amount: 299,
})

const formatDate = (date: string) => {
  return date ? dayjs(date).format('YYYY-MM-DD') : '-'
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    ACTIVE: 'success',
    EXPIRED: 'info',
    DISABLED: 'danger',
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    ACTIVE: '正常',
    EXPIRED: '已过期',
    DISABLED: '已禁用',
  }
  return map[status] || status
}

const isExpiringSoon = (date: string) => {
  if (!date) return false
  const days = dayjs(date).diff(dayjs(), 'day')
  return days <= 7 && days >= 0
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await $api.get('/users', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
        keyword: searchQuery.value,
        userType: filterType.value,
        status: filterStatus.value,
      },
    })
    userList.value = res.data.list
    total.value = res.data.pagination.total
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchUsers()
}

const resetFilter = () => {
  searchQuery.value = ''
  filterType.value = ''
  filterStatus.value = ''
  currentPage.value = 1
  fetchUsers()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchUsers()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchUsers()
}

const handleAdd = () => {
  isEdit.value = false
  form.id = null
  form.nickname = ''
  form.phone = ''
  form.userType = 'TRIAL'
  form.status = 'ACTIVE'
  form.remark = ''
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  form.id = row.id
  form.nickname = row.nickname
  form.phone = row.phone
  form.userType = row.userType
  form.status = row.status
  form.remark = row.remark
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (isEdit.value && form.id) {
          await $api.patch(`/users/${form.id}`, form)
          ElMessage.success('更新成功')
        } else {
          await $api.post('/users', form)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        fetchUsers()
      } catch (error) {
        ElMessage.error('操作失败')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const handleRenew = (row: any) => {
  currentUser.value = row
  renewForm.duration = 12
  renewForm.amount = 299
  renewDialogVisible.value = true
}

const handleRenewSubmit = async () => {
  if (!currentUser.value) return
  
  renewLoading.value = true
  try {
    await $api.post(`/users/${currentUser.value.id}/renew`, renewForm)
    ElMessage.success('续费成功')
    renewDialogVisible.value = false
    fetchUsers()
  } catch (error) {
    ElMessage.error('续费失败')
  } finally {
    renewLoading.value = false
  }
}

const handleToggleStatus = async (row: any) => {
  const newStatus = row.status === 'DISABLED' ? 'ACTIVE' : 'DISABLED'
  const actionText = newStatus === 'ACTIVE' ? '启用' : '禁用'
  
  try {
    await ElMessageBox.confirm(
      `确定要${actionText}该用户吗？`,
      '提示',
      { type: 'warning' }
    )
    await $api.patch(`/users/${row.id}`, { status: newStatus })
    ElMessage.success(`${actionText}成功`)
    fetchUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该用户吗？此操作不可恢复！',
      '警告',
      { type: 'error' }
    )
    await $api.delete(`/users/${row.id}`)
    ElMessage.success('删除成功')
    fetchUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  fetchUsers()
})
</script>
