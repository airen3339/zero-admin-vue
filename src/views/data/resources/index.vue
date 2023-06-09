<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input v-model="listQuery.uri" placeholder="资源路径" style="width: 200px;" class="filter-item"
                @keyup.enter.native="handleFilter"
      />
      <el-input v-model="listQuery.description" placeholder="资源描述" style="width: 200px;" class="filter-item"
                @keyup.enter.native="handleFilter"
      />
      <el-select v-model="listQuery.methodType" placeholder="方法类型" clearable class="filter-item"
                 style="width: 130px" @change="handleFilter"
      >
        <el-option value="GET" label="GET" />
        <el-option value="POST" label="POST" />
        <el-option value="PUT" label="PUT" />
        <el-option value="DELETE" label="DELETE" />
      </el-select>
      <el-select v-model="listQuery.queryRoleId" placeholder="角色" clearable style="width: 100px;margin-right: 10px;"
                 class="filter-item" @change="handleFilter" @visible-change="getRoleList($event)"
      >
        <el-option
          v-for="role in roles"
          :key="role.id"
          :label="role.name"
          :value="role.id"
        />
      </el-select>
      <el-button class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">
        查询
      </el-button>
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit"
                 @click="handleCreate"
      >
        添加
      </el-button>
      <el-button :loading="downloadLoading" class="filter-item" type="primary" icon="el-icon-download"
                 @click="handleDownload"
      >
        导出
      </el-button>
    </div>

    <el-table
      :key="tableKey"
      v-loading="listLoading"
      :data="list"
      border
      fit
      size="mini"
      style="width: 100%;"
      @sort-change="sortChange"
    >
      <el-table-column label="序号" type="index" sortable="true" align="center" width="80" />
      <el-table-column label="资源路径" width="260px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.uri }}</span>
        </template>
      </el-table-column>
      <el-table-column label="资源描述" width="350px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.description }}</span>
        </template>
      </el-table-column>
      <el-table-column label="方法类型" width="80px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.methodType }}</span>
        </template>
      </el-table-column>
      <el-table-column label="拥有该资源的角色" class-name="status-col">
        <template slot-scope="{row}">
          <el-tag
            v-for="(role,index) in row.roles"
            :key="index"
            closable
            :type="tagType[role.id]"
            style="margin-right: 3px;border-radius: 15px;"
            :title="role.description"
            size="mini"
            @close="deleteResourcesRole(row.id, role.id)"
          >
            {{ role.name }}
          </el-tag>
          <el-dropdown trigger="click" @command="addResourcesRole(row.id, $event)">
            <el-button style="border-radius: 20px;" size="mini" @click="getResourcesNotRoleList(row.id)">+</el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item
                v-for="(role,index) in roleList"
                :key="index"
                :title="role.description"
                :command="role.id"
              >{{ role.name }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200px" class-name="small-padding fixed-width">
        <template slot-scope="{row}">
          <el-button type="primary" size="mini" icon="el-icon-edit" @click="handleUpdate(row)">
            编辑
          </el-button>
          <el-button size="mini" type="danger" icon="el-icon-delete" @click="deleteData(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="page.total > 0"
                :total="page.total"
                :page="page.currentPage"
                :limit="page.size"
                @pagination="handlePagination"
    />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="resources" label-position="left" label-width="120px"
               style="width: 400px; margin-left:50px;"
      >
        <el-form-item label="资源路径" prop="uri">
          <el-input v-model="resources.uri" placeholder="请输入资源路径" />
        </el-form-item>
        <el-form-item label="资源描述" prop="description">
          <el-input v-model="resources.description" placeholder="请输入资源描述" />
        </el-form-item>
        <el-form-item label="方法类型" prop="methodType">
          <el-select v-model="resources.methodType" placeholder="请选择方法类型" clearable class="filter-item">
            <el-option value="GET" label="GET" />
            <el-option value="POST" label="POST" />
            <el-option value="PUT" label="PUT" />
            <el-option value="DELETE" label="DELETE" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">关闭</el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">保存</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import {
  getResourcesPage,
  createResources,
  updateResources,
  deleteResources,
  deleteResourcesRole,
  getResourcesNotRoleList,
  addResourcesRole, exportResourcesExcel
} from '@/api/data/resources'
import Pagination from '@/components/Pagination'
import { getRoleList } from '@/api/data/role'

export default {
  name: 'Resources',
  components: { Pagination },
  filters: {
    enabledFilter(enabledValue) {
      return enabledValue ? '启用' : '禁用'
    }
  },
  data() {
    return {
      tableKey: 0,
      list: null,
      page: {
        currentPage: 1,
        size: 10,
        total: 0
      },
      listLoading: false,
      listQuery: {
        uri: null,
        description: null,
        methodType: null,
        queryRoleId: null
      },
      tagType: ['', 'success', 'info', 'warning', 'danger'],
      resources: {
        id: null,
        uri: null,
        description: null,
        methodType: null
      },
      roles: null,
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        create: '添加',
        update: '编辑'
      },
      roleList: [],
      rules: {
        uri: [{ required: true, message: '请输入资源路径', trigger: 'change' }],
        description: [{ required: true, message: '请输入资源描述', trigger: 'change' }],
        methodType: [{ required: true, message: '请选择方法类型', trigger: 'change' }]
      },
      downloadLoading: false
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    loadData() {
      this.listLoading = true
      getResourcesPage(this.page, this.listQuery).then(res => {
        setTimeout(() => {
          if (this.listLoading === true) {
            this.listLoading = false
          }
        }, 1000)
        const page = res.data
        this.list = page.records
        this.page.total = page.total
        this.listLoading = false
      })
    },
    handlePagination(page) {
      this.page.currentPage = page.page
      this.page.size = page.limit
      this.loadData()
    },
    handleCreate() {
      this.resources = {}
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    createData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          createResources(this.resources).then((res) => {
            this.dialogFormVisible = false
            this.$notify({
              title: '成功',
              message: res.message,
              type: 'success',
              duration: 2000
            })
            this.loadData()
          })
        }
      })
    },
    handleUpdate(row) {
      this.resources = Object.assign({}, row) // copy obj
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          updateResources(this.resources).then((res) => {
            this.dialogFormVisible = false
            this.$notify({
              title: '成功',
              message: res.message,
              type: 'success',
              duration: 2000
            })
            this.loadData()
          })
        }
      })
    },
    deleteData(row) {
      this.$confirm('此操作将删除该系统资源, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteResources(row.id).then(res => {
          this.$message({
            type: 'success',
            message: res.message
          })
          this.loadData()
        })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        })
      })
    },
    deleteResourcesRole(userId, roleId) {
      deleteResourcesRole(userId, roleId).then(res => {
        this.$message({
          type: 'success',
          message: res.message
        })
        this.loadData()
      })
    },
    getResourcesNotRoleList(id) {
      getResourcesNotRoleList(id).then(res => {
        const list = res.data
        if (list.length === 0) {
          this.roleList = null
          this.$message({
            type: 'warning',
            message: '所有角色均已拥有该系统资源，无法添加'
          })
        } else {
          this.roleList = list
        }
      })
    },
    addResourcesRole(resourcesId, roleId) {
      addResourcesRole(resourcesId, roleId).then(res => {
        this.$message({
          type: 'success',
          message: res.message
        })
        this.loadData()
      })
    },
    handleFilter() {
      this.page.currentPage = 1
      this.loadData()
    },
    getRoleList(callback) {
      if (callback === true && this.roles === null) {
        getRoleList(null).then(res => {
          this.roles = res.data
        })
      }
    },
    handleModifyStatus(row, status) {
      this.$message({
        message: '操作成功',
        type: 'success'
      })
      row.status = status
    },
    sortChange(data) {
      const { prop, order } = data
      if (prop === 'id') {
        this.sortByID(order)
      }
    },
    sortByID(order) {
      if (order === 'ascending') {
        this.listQuery.sort = '+id'
      } else {
        this.listQuery.sort = '-id'
      }
      this.handleFilter()
    },
    handleDownload() {
      exportResourcesExcel(this.listQuery, '系统资源列表')
    }
  }
}
</script>
<style scoped>

</style>
