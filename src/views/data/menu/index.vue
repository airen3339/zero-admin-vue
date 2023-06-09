<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input v-model="listQuery.metaTitle" placeholder="菜单名称" style="width: 150px;" class="filter-item"
                @keyup.enter.native="handleFilter"
      />
      <el-input v-model="listQuery.path" placeholder="菜单路由路径" style="width: 150px;" class="filter-item"
                @keyup.enter.native="handleFilter"
      />
      <el-input v-model="listQuery.name" placeholder="菜单模块名称" style="width: 150px;" class="filter-item"
                @keyup.enter.native="handleFilter"
      />
      <el-input v-model="listQuery.component" placeholder="菜单模块路径" style="width: 150px;" class="filter-item"
                @keyup.enter.native="handleFilter"
      />
      <el-select v-model="listQuery.enabled" placeholder="是否启用" clearable style="width: 120px" class="filter-item"
                 @change="handleFilter"
      >
        <el-option value="true" label="是" />
        <el-option value="false" label="否" />
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
                 @click="handleCreate(null)"
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
      row-key="id"
      border
      fit
      size="mini"
      style="width: 100%;"
      :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
      @sort-change="sortChange"
    >
      <el-table-column label="序号" sortable="true" align="center" width="80" />
      <el-table-column label="菜单名称" width="110">
        <template slot-scope="{row}">
          <span :style="{'font-weight': row.parentId === 0 ? 'bolder' : '','padding-left': row.parentId !== 0 ? '10px' : ''}">
            <i :class="row.metaIcon" />
            {{ row.metaTitle }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="菜单路由路径" width="100">
        <template slot-scope="{row}">
          <span>{{ row.path }}</span>
        </template>
      </el-table-column>
      <el-table-column label="菜单模块名称" width="100">
        <template slot-scope="{row}">
          <span>{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="菜单模块路径" width="120">
        <template slot-scope="{row}">
          <span>{{ row.component }}</span>
        </template>
      </el-table-column>
      <el-table-column label="是否隐藏" width="150" align="center">
        <template slot-scope="{row}">
          <el-switch
            v-model="row.hidden"
            active-text="隐藏"
            inactive-text="显示"
            @change="hidden(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="是否启用" width="150" align="center">
        <template slot-scope="{row}">
          <el-switch
            v-model="row.enabled"
            active-text="启用"
            inactive-text="禁用"
            @change="enabled(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="菜单排序" width="70" align="center">
        <template slot-scope="{row}">
          <span>{{ row.sort }}</span>
        </template>
      </el-table-column>
      <el-table-column label="菜单角色" class-name="status-col">
        <template slot-scope="{row}">
          <el-tag
            v-for="(role,index) in row.roles"
            :key="index"
            closable
            :type="tagType[role.id]"
            style="margin-right: 3px;border-radius: 15px;"
            :title="role.description"
            size="mini"
            @close="deleteMenuRole(row.id, role.id)"
          >
            {{ role.name }}
          </el-tag>
          <el-dropdown trigger="click" @command="addMenuRole(row.id, $event)">
            <el-button style="border-radius: 20px;" size="mini" @click="getMenuNotRoleList(row.id)">+</el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item
                v-for="(role,index) in roleList"
                :key="index"
                size="mini"
                :title="role.description"
                :command="role.id"
              >{{ role.name }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="left" class-name="small-padding fixed-width" width="250px">
        <template slot-scope="{row}">
          <el-button type="primary" size="mini" icon="el-icon-edit" @click="handleUpdate(row)">
            编辑
          </el-button>
          <el-button size="mini" type="danger" icon="el-icon-delete" @click="deleteData(row)">
            删除
          </el-button>
          <el-button v-if="row.parentId === 0" size="mini" type="warning" icon="el-icon-circle-plus-outline" @click="handleCreate(row)" />
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="page.total > 0"
                :total="page.total"
                :page="page.currentPage"
                :limit="page.size"
                @pagination="handlePagination"
    />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible" width="60%">
      <el-form ref="dataForm" :rules="rules" :model="menu" label-position="left" label-width="180px"
               style="width: 800px; margin-left:50px;" :inline="true"
      >
        <el-form-item label="菜单名称" prop="metaTitle">
          <el-input v-model="menu.metaTitle" placeholder="用户管理" />
        </el-form-item>
        <el-form-item label="菜单路由路径" prop="path">
          <el-input v-model="menu.path" placeholder="user" />
        </el-form-item>
        <el-form-item label="菜单模块名称" prop="name">
          <el-input v-model="menu.name" placeholder="User" />
        </el-form-item>
        <el-form-item label="菜单模块路径" prop="component">
          <el-input v-model="menu.component" placeholder="data/user/index" :disabled="menu.parentId === 0" />
        </el-form-item>
        <el-form-item label="菜单图标" prop="metaIcon">
          <el-input v-model="menu.metaIcon" placeholder="请输入菜单图标" style="width: 190px;" readonly>
            <template slot="append"><i class="el-icon-s-operation" @click="drawer = true" /></template>
          </el-input>
        </el-form-item>
        <el-form-item v-if="menu.parentId === 0" label="父级菜单定向路由路径" prop="redirect">
          <el-input v-model="menu.redirect" placeholder="请输入父级菜单定向路由路径" />
        </el-form-item>
        <el-form-item label="菜单排序" prop="sort">
          <el-input v-model="menu.sort" placeholder="请输入菜单排序" />
        </el-form-item>
        <el-form-item label="是否隐藏" prop="enabled">
          <el-switch
            style="width: 190px"
            v-model="menu.hidden"
            active-text="隐藏"
            inactive-text="显示"
          />
        </el-form-item>
        <el-form-item label="是否启用" prop="enabled">
          <el-switch
            style="width: 190px"
            v-model="menu.enabled"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">关闭</el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">保存</el-button>
      </div>
    </el-dialog>

    <el-drawer
      title="菜单图标"
      :visible.sync="drawer"
      :with-header="false"
      :before-close="handleClose"
    >
      <icon :select="menu.metaIcon" @select-icon="selectIcon"/>
    </el-drawer>

  </div>
</template>
<script>
import Pagination from '@/components/Pagination/index'
import Icon from './components/Icon'
import {
  getMenuPage,
  createMenu,
  enabled,
  deleteMenu,
  deleteMenuRole,
  updateMenu,
  getMenuNotRoleList,
  addMenuRole,
  exportMenuExcel
} from '@/api/data/menu'
import { getRoleList } from '@/api/data/role'

export default {
  name: 'Menu',
  components: { Pagination, Icon },
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
        path: null,
        name: null,
        component: null,
        metaTitle: null,
        enabled: null,
        queryRoleId: null
      },
      tagType: ['', 'success', 'info', 'warning', 'danger'],
      menu: {
        path: null,
        name: null,
        component: 'Layout',
        metaTitle: null,
        metaIcon: null,
        redirect: null,
        hidden: false,
        enabled: true,
        sort: null,
        parentId: 0
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
        metaTitle: [{ required: true, message: '请输入菜单名称', trigger: 'change' }],
        path: [{ required: true, message: '请输入菜单路由路径', trigger: 'change' }],
        name: [{ required: true, message: '请输入菜单模块名称', trigger: 'change' }],
        component: [{ required: true, message: '请输入菜单模块路径', trigger: 'change' }],
        metaIcon: [{ required: true, message: '请输入菜单图标', trigger: 'change' }],
        redirect: [{ required: true, message: '请输入父级菜单定向路由路径', trigger: 'change' }],
        sort: [{ required: true, message: '请输入菜单排序', trigger: 'change' }],
        hidden: [{ required: true, message: '请选择菜单是否隐藏', trigger: 'change' }],
        enabled: [{ required: true, message: '请选择菜单是否启用', trigger: 'change' }]
      },
      downloadLoading: false,
      drawer: false
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    loadData() {
      this.listLoading = true
      getMenuPage(this.page, this.listQuery).then(res => {
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
    hidden(row) {
      enabled(row.id, row.hidden).then(res => {
        this.$notify({
          title: '成功',
          message: res.message,
          type: 'success',
          duration: 2000
        })
        this.loadData()
      })
    },
    enabled(row) {
      enabled(row.id, row.enabled).then(res => {
        this.$notify({
          title: '成功',
          message: res.message,
          type: 'success',
          duration: 2000
        })
        this.loadData()
      })
    },
    handleCreate(row) {
      if (row !== null) {
        this.menu = {
          parentId: row.id
        }
      } else {
        this.menu = {
          component: 'Layout',
          parentId: 0
        }
      }
      this.menu.hidden = false
      this.menu.enabled = true
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    createData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          createMenu(this.menu).then((res) => {
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
      this.menu = Object.assign({}, row) // copy obj
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          updateMenu(this.menu).then((res) => {
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
      this.$confirm('此操作将删除该菜单, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteMenu(row.id).then(res => {
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
    deleteMenuRole(menuId, roleId) {
      deleteMenuRole(menuId, roleId).then(res => {
        this.$message({
          type: 'success',
          message: res.message
        })
        this.loadData()
      })
    },
    getMenuNotRoleList(id) {
      getMenuNotRoleList(id).then(res => {
        const list = res.data
        if (list.length === 0) {
          this.roleList = null
          this.$message({
            type: 'warning',
            message: '所有角色均已拥有该菜单，无法添加'
          })
        } else {
          this.roleList = list
        }
      })
    },
    addMenuRole(menuId, roleId) {
      addMenuRole(menuId, roleId).then(res => {
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
    handleClose(done) {
      done()
    },
    selectIcon(icon) {
      this.menu.metaIcon = icon
      this.drawer = false
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
      exportMenuExcel(this.listQuery, '系统菜单列表')
    }
  }
}
</script>

<style>
  .el-drawer__body {
    overflow: auto;
  }
</style>
