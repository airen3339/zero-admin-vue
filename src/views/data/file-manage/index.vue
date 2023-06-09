<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input v-model="listQuery.name" placeholder="文件名称" style="width: 150px;" class="filter-item"
                @keyup.enter.native="handleFilter"
      />
      <el-select v-model="listQuery.type" placeholder="文件类型" clearable style="width: 120px" class="filter-item"
                 @change="handleFilter"
      >
        <el-option value="IMAGE" label="图片" />
        <el-option value="PDF" label="PDF" />
      </el-select>
      <el-input v-model="listQuery.queryUsername" placeholder="上传用户" style="width: 200px;" class="filter-item"
                @keyup.enter.native="handleFilter"
      />
      <el-date-picker
        v-model="queryDate"
        type="daterange"
        align="right"
        unlink-panels
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="yyyy-MM-dd HH:mm:ss"
        :picker-options="pickerOptions"
      />
      <el-button class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">
        查询
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
      :tree-props="{children: 'bakFiles', hasChildren: 'hasChildren'}"
      @sort-change="sortChange"
    >
      <el-table-column label="序号" type="index" sortable="true" align="center" width="80" />
      <el-table-column label="文件名称">
        <template slot-scope="{row}">
          <span>{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="文件类型" width="80">
        <template slot-scope="{row}">
          <span>{{ row.type }}</span>
        </template>
      </el-table-column>
      <el-table-column label="上传时间" width="200">
        <template slot-scope="{row}">
          <span>{{ row.uploadTime }}</span>
        </template>
      </el-table-column>
      <el-table-column label="上传用户" width="135">
        <template slot-scope="{row}">
          <span>{{ row.user.username }}</span>
        </template>
      </el-table-column>
      <el-table-column label="查看" width="70" align="center">
        <template slot-scope="{row}">
          <span><el-link type="success" @click="view(row)" style="font-size: 12px;">查看</el-link></span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="left"  width="280" class-name="small-padding fixed-width">
        <template slot-scope="{row}">
          <el-button v-if="row.parentId === 0" type="success" size="mini" icon="el-icon-document-copy"
                     @click="bakData(row)"
          >
            备份
          </el-button>
          <el-button type="primary" size="mini" icon="el-icon-sort" @click="handleUpdate(row)">
            替换
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

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible" width="60%">
      <el-upload
        action="#"
        list-type="picture-card"
        :auto-upload="false"
        :limit="1"
        fit="scale-down"
        :on-preview="handlePictureCardPreview"
        :on-remove="handleRemove"
        :on-change="handlerChange"
        :on-exceed="handleExceed"
      >
        <i class="el-icon-plus" />
      </el-upload>

      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">关闭</el-button>
        <el-button style="margin-top: 10px;" type="primary" @click="replaceFile">点击替换</el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="dialogVisible">
      <img width="100%" :src="dialogImageUrl" alt="">
    </el-dialog>

  </div>
</template>
<script>
import Pagination from '@/components/Pagination/index'
import {
  getFileManagePage,
  createFileManage,
  updateFileManage,
  bakFileManage,
  replaceFile,
  deleteFileManage,
  exportFileManageExcel
} from '@/api/data/file-manage'

export default {
  name: 'FileManage',
  components: { Pagination },
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
      queryDate: null,
      listQuery: {
        name: null,
        type: null,
        queryUsername: null,
        queryStartDate: null,
        queryEndDate: null
      },
      fileManage: {
        name: null,
        type: null,
        uri: null,
        path: null,
        uploadTime: null,
        uploadUserId: true,
        parentId: 0,
        user: null
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        create: '添加',
        update: '替换'
      },
      downloadLoading: false,
      pickerOptions: {
        shortcuts: [{
          text: '最近一周',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: '最近一个月',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: '最近三个月',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
            picker.$emit('pick', [start, end])
          }
        }]
      },
      dialogVisible: false,
      dialogImageUrl: null,
      file: null
    }
  },
  watch: {
    queryDate(newValue, oldValue) {
      if (newValue === null) {
        this.listQuery.queryStartDate = null
        this.listQuery.queryEndDate = null
      } else {
        this.listQuery.queryStartDate = newValue[0]
        this.listQuery.queryEndDate = newValue[1]
      }
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    loadData() {
      this.listLoading = true
      getFileManagePage(this.page, this.listQuery).then(res => {
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
    handleUpdate(row) {
      // 复制一个新的对象
      this.fileManage = Object.assign({}, row)
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
    },
    bakData(row) {
      this.$confirm('此操作将备份该文件, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        bakFileManage(row.id).then(res => {
          this.$message({
            type: 'success',
            message: res.message
          })
          this.loadData()
        })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消备份'
        })
      })
    },
    deleteData(row) {
      this.$confirm('此操作将删除该文件, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteFileManage(row.id).then(res => {
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
    view(row) {
      this.dialogVisible = true
      // 在图片请求的末尾加上一个随机的时间戳，用于防止浏览器使用图片缓存导致图片无法及时刷新
      this.dialogImageUrl = row.uri + '?' + Math.random()
    },
    handleFilter() {
      this.page.currentPage = 1
      this.loadData()
    },
    replaceFile() {
      if (this.file === null) {
        this.$message({
          type: 'info',
          message: '请选择替换的文件'
        })
        return
      }
      this.$confirm('上传该文件, 将会替换原文件, 是否继续?', '提示', {
        confirmButtonText: '继续上传',
        cancelButtonText: '取消上传',
        type: 'warning'
      }).then(() => {
        replaceFile(this.fileManage.id, this.file).then(async(res) => {
          this.dialogFormVisible = false
          this.$notify({
            title: '成功',
            message: '文件替换成功',
            type: 'success',
            duration: 2000
          })
        })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消上传'
        })
      })
    },
    handlerChange(file, fileList) {
      this.file = file.raw
    },
    handlePictureCardPreview(file) {
      this.dialogImageUrl = file.url
      this.dialogVisible = true
    },
    handleRemove(file) {
      this.file = null
    },
    handleExceed(files, fileList) {
      this.$message({
        type: 'info',
        message: '只允许上传一个文件'
      })
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
      exportFileManageExcel(this.listQuery, '文件管理列表')
    }
  }
}
</script>
