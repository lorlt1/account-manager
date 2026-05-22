<template>
  <view class="app-shell">
    <view v-if="!isLoggedIn" class="auth-screen">
      <view class="auth-brand">
        <text class="auth-kicker">Identity Vault</text>
        <text class="auth-title">账号管家</text>
        <text class="auth-copy">保存你的 App 账号、密码和分类，打开就能查。</text>
      </view>

      <view class="auth-card">
        <view class="auth-tabs">
          <view class="auth-tab" :class="{ active: authMode === 'login' }" @tap="switchAuthMode('login')">登录</view>
          <view class="auth-tab" :class="{ active: authMode === 'register' }" @tap="switchAuthMode('register')">注册</view>
        </view>

        <text class="auth-label">账号</text>
        <input v-model="authDraft.username" class="field auth-field" placeholder="请输入用户名" />
        <text class="auth-label">密码</text>
        <input v-model="authDraft.password" class="field auth-field" password placeholder="请输入密码" />
        <text v-if="authMode === 'register'" class="auth-label">确认密码</text>
        <input
          v-if="authMode === 'register'"
          v-model="authDraft.confirmPassword"
          class="field auth-field"
          password
          placeholder="再次输入密码"
        />

        <button class="primary-button auth-submit" @tap="authMode === 'login' ? login() : register()">
          {{ authMode === 'login' ? '登录' : '创建账号' }}
        </button>
        <text class="auth-hint">
          {{ authMode === 'login' ? '没有账号？点上方注册。' : '注册成功后会自动登录。' }}
        </text>
      </view>
    </view>

    <template v-else>
    <view class="topbar">
      <view>
        <text class="hello">Hello, {{ displayName }}!</text>
      </view>
      <view class="top-actions">
        <button class="avatar-button" @tap="activeTab = 'settings'">{{ userInitial }}</button>
      </view>
    </view>

    <scroll-view scroll-y class="page-scroll">
      <view v-if="activeTab === 'home'" class="screen">
        <view class="portfolio-card">
          <view class="card-head">
            <text class="card-label">账号资产总览</text>
            <button class="mini-add" @tap="openAddForm">新增</button>
          </view>
          <text class="portfolio-number">{{ accounts.length }}</text>
          <text class="portfolio-note">已记录账号 · 订阅 {{ subscriptionReminderCount }} · 待续费 {{ dueAlerts.length }}</text>
        </view>

        <view class="metric-grid">
          <view v-for="item in stats" :key="item.label" class="metric-card">
            <text class="metric-label">{{ item.label }}</text>
            <text class="metric-value">{{ item.value }}</text>
          </view>
        </view>

        <view class="section-row">
          <text class="section-title">最近账号</text>
          <text class="section-link">全部 {{ accounts.length }}</text>
        </view>
        <view class="list-card">
          <view v-if="!recentAccounts.length" class="empty-row">
            <text>还没有账号。点底部 + 新增，或到“我的”里导入。</text>
          </view>
          <view v-for="account in recentAccounts" :key="account.id" class="list-row">
            <view class="app-token" :style="{ background: account.color }">{{ account.short }}</view>
            <view class="row-main">
              <text class="row-title">{{ account.name }}</text>
              <text class="row-sub">{{ account.category }} · {{ account.login }}</text>
            </view>
            <text class="soft-pill">{{ account.renewal === '无' ? '未订阅' : account.renewal }}</text>
          </view>
        </view>
      </view>

      <view v-else-if="activeTab === 'accounts'" class="screen">
        <view class="search-card">
          <view class="search-box">
            <text class="search-symbol">⌕</text>
            <input v-model="keyword" class="search-input" placeholder="搜索 App、邮箱、手机号或分类" />
          </view>
          <view class="segmented">
            <view
              v-for="filter in filters"
              :key="filter.value"
              class="segment"
              :class="{ active: accountFilter === filter.value }"
              @tap="accountFilter = filter.value"
            >
              {{ filter.label }}
            </view>
          </view>
        </view>

        <view class="account-list">
          <view v-if="!filteredAccounts.length" class="empty-card">
            <text class="empty-title">没有匹配的账号</text>
            <text class="empty-copy">可以切换筛选，或点底部 + 新增账号。</text>
          </view>
          <view v-for="account in filteredAccounts" :key="account.id" class="account-card">
            <view class="account-head">
              <view class="app-token large" :style="{ background: account.color }">{{ account.short }}</view>
              <view class="row-main">
                <text class="row-title">{{ account.name }}</text>
                <text class="row-sub">{{ account.login }}</text>
              </view>
              <view class="card-actions">
                <button class="small-action" @tap="editAccount(account)">编辑</button>
                <button class="small-action danger" @tap="deleteAccount(account.id)">删除</button>
              </view>
            </view>

            <view class="password-panel">
            <view class="password-main">
              <text class="mini-label left">密码</text>
              <text class="password-text">
                  {{ isPasswordVisible(account.id) ? account.password : maskPassword(account.password) }}
              </text>
            </view>
            <view class="password-actions">
              <button class="password-button" @tap="togglePasswordVisibility(account.id)">
                  {{ isPasswordVisible(account.id) ? '隐藏' : '查看' }}
              </button>
                <button class="password-button dark" @tap="copyPassword(account.password)">复制</button>
              </view>
            </view>

            <view class="info-grid">
              <view>
                <text class="mini-label">分类</text>
                <text class="mini-value">{{ account.category }}</text>
              </view>
              <view>
                <text class="mini-label">续费</text>
                <text class="mini-value">{{ account.renewal }}</text>
              </view>
              <view>
                <text class="mini-label">状态</text>
                <text class="mini-value">{{ account.password ? '已保存' : '未填写' }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-else-if="activeTab === 'alerts'" class="screen">
        <view class="section-row first">
          <text class="section-title">订阅提醒</text>
          <text class="section-link">3 天内到期 {{ dueAlerts.length }} 项</text>
        </view>

        <view class="form-card">
          <view class="section-row compact">
            <text class="section-title">新增订阅</text>
          </view>
          <view class="subscription-select">
            <view
              v-for="account in subscriptionAccounts"
              :key="account.id"
              class="subscription-option"
              :class="{ active: selectedSubscriptionAccountId === account.id }"
              @tap="selectedSubscriptionAccountId = account.id"
            >
              <text>{{ account.name }}</text>
            </view>
            <view v-if="!subscriptionAccounts.length" class="empty-row">
              <text>请先在账号页添加分类为“订阅”的账号。</text>
            </view>
          </view>
          <input v-model="subscriptionDraft.startDate" class="field" type="date" placeholder="开始日期，例如 2026-05-22" />
          <input v-model.number="subscriptionDraft.durationDays" class="field" type="number" placeholder="订阅时长，单位：天" />
          <button class="primary-button" @tap="addSubscriptionReminder">保存订阅</button>
        </view>

        <view class="section-row">
          <text class="section-title">即将到期</text>
          <text class="section-link">{{ dueAlerts.length ? '自动筛选' : '暂无提醒' }}</text>
        </view>
        <view class="list-card">
          <view v-if="!dueAlerts.length" class="empty-row">
            <text>没有 3 天内到期的订阅。</text>
          </view>
          <view v-for="alert in dueAlerts" :key="alert.id" class="list-row">
            <view class="date-token">{{ alert.remainingDays }}天</view>
            <view class="row-main">
              <text class="row-title">{{ alert.name }}</text>
              <text class="row-sub">到期日 {{ alert.expiryDate }} · 时长 {{ alert.durationDays }} 天</text>
            </view>
            <button class="small-action danger" @tap="deleteSubscriptionReminder(alert.id)">删除</button>
          </view>
        </view>
      </view>

      <view v-else class="screen">
        <view class="section-row first">
          <text class="section-title">我的</text>
          <button class="logout-button" @tap="logout">退出登录</button>
        </view>
        <view class="list-card">
          <view class="list-row">
            <view class="setting-token">D</view>
            <view class="row-main">
              <text class="row-title">本地数据</text>
              <text class="row-sub">账号、密码、订阅提醒已保存在本机</text>
            </view>
            <text class="setting-value">已接入</text>
          </view>
          <view class="list-row" @tap="pushCloudData">
            <view class="setting-token">U</view>
            <view class="row-main">
              <text class="row-title">上传到云端</text>
              <text class="row-sub">把本机账号和订阅提醒同步到服务器</text>
            </view>
            <text class="chevron">›</text>
          </view>
          <view class="list-row" @tap="pullCloudData">
            <view class="setting-token green">S</view>
            <view class="row-main">
              <text class="row-title">从云端恢复</text>
              <text class="row-sub">用服务器数据覆盖当前本机数据</text>
            </view>
            <text class="chevron">›</text>
          </view>
          <view class="list-row">
            <view class="setting-token yellow">C</view>
            <view class="row-main">
              <text class="row-title">云同步状态</text>
              <text class="row-sub">{{ cloudStatusText }}</text>
            </view>
            <text class="setting-value">{{ cloudToken ? '在线' : '未登录' }}</text>
          </view>
          <view class="list-row" @tap="exportBackup">
            <view class="setting-token green">E</view>
            <view class="row-main">
              <text class="row-title">导出备份</text>
              <text class="row-sub">导出账号、密码、分类和备注</text>
            </view>
            <text class="chevron">›</text>
          </view>
          <view class="list-row" @tap="importBackup">
            <view class="setting-token yellow">I</view>
            <view class="row-main">
              <text class="row-title">导入备份</text>
              <text class="row-sub">从备份文件恢复账号数据</text>
            </view>
            <text class="chevron">›</text>
          </view>
          <view class="list-row" @tap="clearCurrentUserData">
            <view class="setting-token red">C</view>
            <view class="row-main">
              <text class="row-title">清空数据</text>
              <text class="row-sub">删除本机保存的所有账号</text>
            </view>
            <text class="chevron">›</text>
          </view>
        </view>

        <view class="section-row">
          <text class="section-title">默认偏好</text>
        </view>
        <view class="list-card">
          <view class="list-row">
            <view class="setting-token">P</view>
            <view class="row-main">
              <text class="row-title">默认隐藏密码</text>
              <text class="row-sub">打开账号时先显示圆点，需要时再点查看</text>
            </view>
            <switch :checked="defaultHidePasswords" color="#214A87" @change="toggleDefaultHidePasswords" />
          </view>
        </view>
      </view>
    </scroll-view>

    <view v-if="showForm" class="modal-mask" @tap="closeForm">
      <view class="modal-card" @tap.stop>
        <view class="section-row compact">
          <text class="section-title">{{ editingId ? '编辑账号' : '新增账号' }}</text>
          <button class="text-button" @tap="closeForm">关闭</button>
        </view>
        <input v-model="draft.name" class="field" placeholder="App 名称，例如 GitHub" />
        <input v-model="draft.login" class="field" placeholder="登录账号 / 邮箱 / 手机号" />
        <input v-model="draft.password" class="field" password placeholder="密码，例如 App 登录密码" />
        <view class="category-picker">
          <view
            v-for="category in categoryOptions"
            :key="category.value"
            class="category-chip"
            :class="{ active: draft.category === category.value }"
            @tap="selectCategory(category.value)"
          >
            <text class="category-chip-title">{{ category.label }}</text>
            <text class="category-chip-hint">{{ category.hint }}</text>
          </view>
        </view>
        <input v-model="draft.category" class="field" placeholder="自定义分类，例如 开发 / 社交 / 邮箱" />
        <button class="primary-button" @tap="saveAccount">{{ editingId ? '保存修改' : '保存账号' }}</button>
      </view>
    </view>

    <view class="tabbar">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: tab.key === activeTab, primary: tab.key === 'create' }"
        @tap="handleTabTap(tab.key)"
      >
        <view v-if="tab.key === 'create'" class="create-button">
          <text>+</text>
        </view>
        <template v-else>
          <text class="tab-icon">{{ tab.icon }}</text>
          <text class="tab-text">{{ tab.label }}</text>
        </template>
      </view>
    </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";

type Risk = "high" | "medium" | "low";
type TabKey = "home" | "accounts" | "alerts" | "settings";
type NavKey = TabKey | "create";

interface Account {
  id: number;
  name: string;
  short: string;
  login: string;
  password: string;
  category: string;
  renewal: string;
  risk: Risk;
  issue: string;
  color: string;
  tags: string[];
}

interface SubscriptionReminder {
  id: number;
  accountId: number;
  name: string;
  startDate: string;
  durationDays: number;
}

interface LocalUser {
  username: string;
  password: string;
}

interface UserData {
  accounts: Account[];
  subscriptionReminders: SubscriptionReminder[];
  defaultHidePasswords: boolean;
}

interface CloudAuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
  };
}

interface CloudSyncResponse {
  data: UserData | null;
  updatedAt: string | null;
}

const API_BASE_URL = "https://gdfkgtsddqxo.sealoshzh.site";
const USERS_STORAGE_KEY = "account-manager-users";
const SESSION_STORAGE_KEY = "account-manager-current-user";
const CLOUD_TOKEN_STORAGE_KEY = "account-manager-cloud-token";
const USER_DATA_PREFIX = "account-manager-data:";
const CATEGORY_PERSONAL = "个人";
const CATEGORY_SUBSCRIPTION = "订阅";
const CATEGORY_SERVICE = "服务";
const CATEGORY_CLOUD_SERVICE = "云服务";
const NO_RENEWAL = "无";
const AUTO_SYNC_DELAY = 1200;

const registeredUsers = ref<LocalUser[]>([]);
const currentUser = ref<LocalUser | null>(null);
const cloudToken = ref("");
const isSyncingCloud = ref(false);
const isHydratingUserData = ref(false);
const hasLoadedCloudOnLogin = ref(false);
const lastCloudSyncAt = ref("");
let autoSyncTimer: ReturnType<typeof setTimeout> | null = null;
const authMode = ref<"login" | "register">("login");
const authDraft = reactive({
  username: "",
  password: "",
  confirmPassword: "",
});

const activeTab = ref<TabKey>("home");
const keyword = ref("");
const accountFilter = ref<"all" | "subscription" | "personal" | "service">("all");
const showForm = ref(false);
const editingId = ref<number | null>(null);
const visiblePasswordIds = ref<Set<number>>(new Set());
const hiddenPasswordIds = ref<Set<number>>(new Set());
const defaultHidePasswords = ref(true);
const subscriptionReminders = ref<SubscriptionReminder[]>([
  { id: 1, accountId: 2, name: "ChatGPT", startDate: new Date().toISOString().slice(0, 10), durationDays: 2 },
]);
const selectedSubscriptionAccountId = ref<number | null>(2);

const draft = reactive({
  name: "",
  login: "",
  password: "",
  category: "",
});

const subscriptionDraft = reactive({
  startDate: new Date().toISOString().slice(0, 10),
  durationDays: 30,
});

const isLoggedIn = computed(() => Boolean(currentUser.value));

const displayName = computed(() => currentUser.value?.username || "Alex");

const userInitial = computed(() => displayName.value.trim().slice(0, 1).toUpperCase() || "A");

const cloudStatusText = computed(() => {
  if (!cloudToken.value) {
    return "登录后自动同步云端备份";
  }

  if (isSyncingCloud.value) {
    return "正在同步云端数据";
  }

  return lastCloudSyncAt.value ? `上次同步 ${lastCloudSyncAt.value}` : "已连接云端，修改后会自动同步";
});

onMounted(() => {
  registeredUsers.value = uni.getStorageSync(USERS_STORAGE_KEY) || [];
  currentUser.value = uni.getStorageSync(SESSION_STORAGE_KEY) || null;
  cloudToken.value = uni.getStorageSync(CLOUD_TOKEN_STORAGE_KEY) || "";
  if (currentUser.value) {
    loadUserData(currentUser.value.username);
  }
});

const tabs = [
  { key: "home" as const, label: "首页", icon: "⌂" },
  { key: "accounts" as const, label: "账号", icon: "▣" },
  { key: "create" as const, label: "新增", icon: "+" },
  { key: "alerts" as const, label: "提醒", icon: "◇" },
  { key: "settings" as const, label: "我的", icon: "●" },
];

const filters = [
  { label: "全部", value: "all" as const },
  { label: "个人", value: "personal" as const },
  { label: "订阅", value: "subscription" as const },
  { label: "服务", value: "service" as const },
];

const categoryOptions = [
  { label: "个人", value: CATEGORY_PERSONAL, hint: "普通账号" },
  { label: "订阅", value: CATEGORY_SUBSCRIPTION, hint: "续费提醒" },
  { label: "服务", value: CATEGORY_SERVICE, hint: "云服务/域名" },
];

const accounts = ref<Account[]>([
  {
    id: 1,
    name: "GitHub",
    short: "GH",
    login: "dev@example.com",
    password: "GitHub@2026!",
    category: "开发",
    renewal: "无",
    risk: "low",
    issue: "已保存密码",
    color: "#1F407A",
    tags: ["代码"],
  },
  {
    id: 2,
    name: "ChatGPT",
    short: "AI",
    login: "me@example.com",
    password: "ChatGPT#2026",
    category: "订阅",
    renewal: "06-12",
    risk: "high",
    issue: "订阅账号",
    color: "#8FCB9B",
    tags: ["AI"],
  },
  {
    id: 3,
    name: "小红书",
    short: "RED",
    login: "手机号 188****0921",
    password: "RedBook@0921",
    category: "社交",
    renewal: "无",
    risk: "medium",
    issue: "手机号登录",
    color: "#F3C84B",
    tags: ["内容"],
  },
  {
    id: 4,
    name: "阿里云",
    short: "云",
    login: "ops@example.com",
    password: "Aliyun#0530",
    category: "云服务",
    renewal: "05-30",
    risk: "medium",
    issue: "云服务账号",
    color: "#214A87",
    tags: ["云"],
  },
]);

const stats = computed(() => [
  { label: "订阅数", value: subscriptionReminderCount.value },
  { label: "待续费", value: dueAlerts.value.length },
]);

const recentAccounts = computed(() => accounts.value.slice(0, 3));
const subscriptionReminderCount = computed(() => subscriptionReminders.value.length);
const categoryCount = computed(() => new Set(accounts.value.map((item) => item.category)).size);
const subscriptionAccounts = computed(() => accounts.value.filter((item) => isSubscriptionAccount(item)));
const selectedSubscriptionAccount = computed(
  () => subscriptionAccounts.value.find((item) => item.id === selectedSubscriptionAccountId.value) || null
);

const filteredAccounts = computed(() => {
  const value = keyword.value.trim().toLowerCase();
  return accounts.value.filter((account) => {
    const filterMatched =
      accountFilter.value === "all" ||
      (accountFilter.value === "subscription" && isSubscriptionAccount(account)) ||
      (accountFilter.value === "personal" && isPersonalAccount(account)) ||
      (accountFilter.value === "service" && isServiceAccount(account));
    const text = [account.name, account.login, account.category, ...account.tags]
      .join(" ")
      .toLowerCase();
    return filterMatched && (!value || text.includes(value));
  });
});

const dueAlerts = computed(() =>
  subscriptionReminders.value
    .map((item) => {
      const expiry = getExpiryDate(item.startDate, item.durationDays);
      return {
        ...item,
        expiryDate: formatDate(expiry),
        remainingDays: getRemainingDays(expiry),
      };
    })
    .filter((item) => item.remainingDays >= 0 && item.remainingDays <= 3)
);

watch(
  [accounts, subscriptionReminders, defaultHidePasswords],
  () => {
    persistCurrentUserData();
  },
  { deep: true }
);

watch(
  cloudToken,
  (token) => {
    if (token && currentUser.value && !hasLoadedCloudOnLogin.value) {
      hasLoadedCloudOnLogin.value = true;
      void pullCloudData({ silent: true, confirm: false });
    }
  },
  { immediate: true }
);

watch(
  subscriptionAccounts,
  (items) => {
    if (!items.length) {
      selectedSubscriptionAccountId.value = null;
      return;
    }

    const selectedStillExists = items.some((item) => item.id === selectedSubscriptionAccountId.value);
    if (!selectedStillExists) {
      selectedSubscriptionAccountId.value = items[0].id;
    }
  },
  { immediate: true }
);

function switchAuthMode(mode: "login" | "register") {
  authMode.value = mode;
  authDraft.password = "";
  authDraft.confirmPassword = "";
}

function getUserDataStorageKey(username: string) {
  return `${USER_DATA_PREFIX}${username}`;
}

function getCurrentUserData(): UserData {
  return {
    accounts: accounts.value,
    subscriptionReminders: subscriptionReminders.value,
    defaultHidePasswords: defaultHidePasswords.value,
  };
}

function persistCurrentUserData() {
  if (!currentUser.value || isHydratingUserData.value) {
    return;
  }

  uni.setStorageSync(getUserDataStorageKey(currentUser.value.username), getCurrentUserData());
  scheduleAutoCloudSync();
}

function loadUserData(username: string) {
  isHydratingUserData.value = true;
  const savedData = uni.getStorageSync(getUserDataStorageKey(username)) as UserData | "";

  if (savedData) {
    accounts.value = savedData.accounts || [];
    subscriptionReminders.value = savedData.subscriptionReminders || [];
    defaultHidePasswords.value = savedData.defaultHidePasswords ?? true;
  } else {
    accounts.value = [];
    subscriptionReminders.value = [];
    defaultHidePasswords.value = true;
    uni.setStorageSync(getUserDataStorageKey(username), getCurrentUserData());
  }

  selectedSubscriptionAccountId.value = subscriptionAccounts.value[0]?.id || null;
  visiblePasswordIds.value = new Set();
  hiddenPasswordIds.value = new Set();
  setTimeout(() => {
    isHydratingUserData.value = false;
  }, 0);
}

function requestCloud<T>(
  path: string,
  options: { method?: "GET" | "POST" | "PUT"; data?: string | Record<string, unknown> | ArrayBuffer; auth?: boolean } = {}
) {
  return new Promise<T>((resolve, reject) => {
    const header: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (options.auth && cloudToken.value) {
      header.Authorization = `Bearer ${cloudToken.value}`;
    }

    uni.request({
      url: `${API_BASE_URL}${path}`,
      method: options.method || "GET",
      data: options.data,
      header,
      success: (response) => {
        const statusCode = response.statusCode || 0;
        const data = response.data as { error?: string };
        if (statusCode >= 200 && statusCode < 300) {
          resolve(response.data as T);
          return;
        }

        reject(new Error(data?.error || `云端请求失败 ${statusCode}`));
      },
      fail: (error) => {
        reject(new Error(error.errMsg ? `云端连接失败：${error.errMsg}` : "无法连接云端服务"));
      },
    });
  });
}

function saveCloudLogin(auth: CloudAuthResponse) {
  const user = { username: auth.user.username, password: "" };
  currentUser.value = user;
  uni.setStorageSync(SESSION_STORAGE_KEY, user);
  uni.setStorageSync(CLOUD_TOKEN_STORAGE_KEY, auth.token);
  cloudToken.value = auth.token;
  loadUserData(user.username);
}

function clearCloudLogin() {
  cloudToken.value = "";
  hasLoadedCloudOnLogin.value = false;
  lastCloudSyncAt.value = "";
  if (autoSyncTimer) {
    clearTimeout(autoSyncTimer);
    autoSyncTimer = null;
  }
  uni.removeStorageSync(CLOUD_TOKEN_STORAGE_KEY);
}

async function register() {
  const username = authDraft.username.trim();
  if (!username || !authDraft.password) {
    uni.showToast({ title: "请填写用户名和密码", icon: "none" });
    return;
  }

  if (authDraft.password.length < 6) {
    uni.showToast({ title: "密码至少 6 位", icon: "none" });
    return;
  }

  if (authDraft.password !== authDraft.confirmPassword) {
    uni.showToast({ title: "两次密码不一致", icon: "none" });
    return;
  }

  try {
    const auth = await requestCloud<CloudAuthResponse>("/auth/register", {
      method: "POST",
      data: { username, password: authDraft.password },
    });
    saveCloudLogin(auth);
    resetAuthDraft();
    uni.showToast({ title: "注册成功", icon: "success" });
  } catch (error) {
    uni.showToast({ title: getErrorMessage(error), icon: "none" });
  }
}

async function login() {
  const username = authDraft.username.trim();
  if (!username || !authDraft.password) {
    uni.showToast({ title: "请填写账号和密码", icon: "none" });
    return;
  }

  try {
    const auth = await requestCloud<CloudAuthResponse>("/auth/login", {
      method: "POST",
      data: { username, password: authDraft.password },
    });
    saveCloudLogin(auth);
    resetAuthDraft();
    uni.showToast({ title: "登录成功", icon: "success" });
  } catch (error) {
    const localUser = registeredUsers.value.find(
      (item) => item.username === username && item.password === authDraft.password
    );
    if (localUser) {
      clearCloudLogin();
      currentUser.value = localUser;
      uni.setStorageSync(SESSION_STORAGE_KEY, localUser);
      loadUserData(localUser.username);
      resetAuthDraft();
      uni.showToast({ title: "已离线登录", icon: "success" });
      return;
    }

    uni.showToast({ title: getErrorMessage(error), icon: "none" });
  }
}

function logout() {
  currentUser.value = null;
  uni.removeStorageSync(SESSION_STORAGE_KEY);
  clearCloudLogin();
  authMode.value = "login";
  visiblePasswordIds.value = new Set();
  hiddenPasswordIds.value = new Set();
  resetAuthDraft();
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "操作失败，请稍后再试";
}

function isNoRenewal(value: string) {
  return !value || value === NO_RENEWAL;
}

function isServiceAccount(account: Account) {
  return account.category === CATEGORY_SERVICE || account.category === CATEGORY_CLOUD_SERVICE;
}

function isSubscriptionAccount(account: Account) {
  return account.category === CATEGORY_SUBSCRIPTION;
}

function isPersonalAccount(account: Account) {
  return !isSubscriptionAccount(account) && !isServiceAccount(account);
}

function normalizeCategory(category: string) {
  const value = category.trim();
  if (!value) {
    return CATEGORY_PERSONAL;
  }

  if (value === CATEGORY_CLOUD_SERVICE) {
    return CATEGORY_SERVICE;
  }

  return value;
}

function getCategoryColor(category: string, currentColor?: string) {
  if (category === CATEGORY_SERVICE) {
    return "#214A87";
  }

  if (category === CATEGORY_SUBSCRIPTION) {
    return "#8FCB9B";
  }

  return currentColor || "#F3C84B";
}

function selectCategory(category: string) {
  draft.category = category;
}

function markCloudSynced() {
  const now = new Date();
  lastCloudSyncAt.value = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function scheduleAutoCloudSync() {
  if (!cloudToken.value || !currentUser.value || isSyncingCloud.value) {
    return;
  }

  if (autoSyncTimer) {
    clearTimeout(autoSyncTimer);
  }

  autoSyncTimer = setTimeout(() => {
    autoSyncTimer = null;
    void pushCloudData({ silent: true, confirm: false });
  }, AUTO_SYNC_DELAY);
}

function resetAuthDraft() {
  authDraft.username = "";
  authDraft.password = "";
  authDraft.confirmPassword = "";
}

function openAddForm() {
  activeTab.value = "accounts";
  editingId.value = null;
  resetDraft();
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editingId.value = null;
  resetDraft();
}

function resetDraft() {
  draft.name = "";
  draft.login = "";
  draft.password = "";
  draft.category = "";
}

function handleTabTap(key: NavKey) {
  if (key === "create") {
    openAddForm();
    return;
  }

  activeTab.value = key;
}

function maskPassword(password: string) {
  if (!password) {
    return "未填写";
  }

  return "•".repeat(Math.max(8, Math.min(password.length, 14)));
}

function isPasswordVisible(id: number) {
  if (defaultHidePasswords.value) {
    return visiblePasswordIds.value.has(id);
  }

  return !hiddenPasswordIds.value.has(id);
}

function togglePasswordVisibility(id: number) {
  if (defaultHidePasswords.value) {
    const nextIds = new Set(visiblePasswordIds.value);
    if (nextIds.has(id)) {
      nextIds.delete(id);
    } else {
      nextIds.add(id);
    }
    visiblePasswordIds.value = nextIds;
    return;
  }

  const nextHiddenIds = new Set(hiddenPasswordIds.value);
  if (nextHiddenIds.has(id)) {
    nextHiddenIds.delete(id);
  } else {
    nextHiddenIds.add(id);
  }
  hiddenPasswordIds.value = nextHiddenIds;
}

function toggleDefaultHidePasswords(event: Event) {
  const detail = (event as unknown as { detail: { value: boolean } }).detail;
  defaultHidePasswords.value = Boolean(detail.value);
  visiblePasswordIds.value = new Set();
  hiddenPasswordIds.value = new Set();
}

function copyPassword(password: string) {
  if (!password) {
    uni.showToast({ title: "未填写密码", icon: "none" });
    return;
  }

  uni.setClipboardData({
    data: password,
    success: () => {
      uni.showToast({ title: "已复制密码", icon: "success" });
    },
  });
}

function editAccount(account: Account) {
  activeTab.value = "accounts";
  editingId.value = account.id;
  draft.name = account.name;
  draft.login = account.login;
  draft.password = account.password;
  draft.category = account.category;
  showForm.value = true;
}

function deleteAccount(id: number) {
  uni.showModal({
    title: "删除账号",
    content: "确定要删除这个账号吗？",
    confirmText: "删除",
    confirmColor: "#E46D5D",
    success: (result) => {
      if (!result.confirm) {
        return;
      }

      accounts.value = accounts.value.filter((item) => item.id !== id);
      subscriptionReminders.value = subscriptionReminders.value.filter((item) => item.accountId !== id);
      const nextIds = new Set(visiblePasswordIds.value);
      nextIds.delete(id);
      visiblePasswordIds.value = nextIds;
      if (editingId.value === id) {
        closeForm();
      }
      uni.showToast({ title: "已删除", icon: "success" });
    },
  });
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getExpiryDate(startDate: string, durationDays: number) {
  const date = parseLocalDate(startDate);
  date.setDate(date.getDate() + Number(durationDays || 0));
  return date;
}

function getRemainingDays(expiryDate: Date) {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfExpiry = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());
  return Math.ceil((startOfExpiry.getTime() - startOfToday.getTime()) / 86400000);
}

function formatDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatShortDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}-${day}`;
}

function addSubscriptionReminder() {
  const account = selectedSubscriptionAccount.value;
  if (!account) {
    uni.showToast({ title: "请选择订阅账号", icon: "none" });
    return;
  }

  if (!subscriptionDraft.startDate) {
    uni.showToast({ title: "请选择开始日期", icon: "none" });
    return;
  }

  if (!subscriptionDraft.durationDays || subscriptionDraft.durationDays <= 0) {
    uni.showToast({ title: "请填写有效时长", icon: "none" });
    return;
  }

  const expiryDate = getExpiryDate(subscriptionDraft.startDate, Number(subscriptionDraft.durationDays));
  const nextReminder = {
    id: Date.now(),
    accountId: account.id,
    name: account.name,
    startDate: subscriptionDraft.startDate,
    durationDays: Number(subscriptionDraft.durationDays),
  };
  subscriptionReminders.value = [
    nextReminder,
    ...subscriptionReminders.value.filter((item) => item.accountId !== account.id),
  ];
  account.renewal = formatShortDate(expiryDate);
  subscriptionDraft.startDate = new Date().toISOString().slice(0, 10);
  subscriptionDraft.durationDays = 30;
  uni.showToast({ title: "已保存订阅", icon: "success" });
}

function deleteSubscriptionReminder(id: number) {
  const reminder = subscriptionReminders.value.find((item) => item.id === id);
  subscriptionReminders.value = subscriptionReminders.value.filter((item) => item.id !== id);
  if (reminder) {
    const account = accounts.value.find((item) => item.id === reminder.accountId);
    if (account) {
      account.renewal = NO_RENEWAL;
    }
  }
  uni.showToast({ title: "已删除订阅", icon: "success" });
}

function ensureCloudReady(silent = false) {
  if (!currentUser.value || !cloudToken.value) {
    if (!silent) {
      uni.showToast({ title: "请先登录云端账号", icon: "none" });
    }
    return false;
  }

  if (isSyncingCloud.value) {
    if (!silent) {
      uni.showToast({ title: "正在同步，请稍等", icon: "none" });
    }
    return false;
  }

  return true;
}

function confirmAction(title: string, content: string, confirmText = "确定") {
  return new Promise<boolean>((resolve) => {
    uni.showModal({
      title,
      content,
      confirmText,
      confirmColor: "#214A87",
      success: (result) => resolve(Boolean(result.confirm)),
      fail: () => resolve(false),
    });
  });
}

async function pushCloudData(options: { silent?: boolean; confirm?: boolean } = {}) {
  if (!ensureCloudReady(Boolean(options.silent))) {
    return;
  }

  if (options.confirm !== false) {
    const confirmed = await confirmAction("上传到云端", "会用当前本机数据覆盖云端备份，确定继续吗？", "上传");
    if (!confirmed) {
      return;
    }
  }

  try {
    isSyncingCloud.value = true;
    await requestCloud<{ ok: boolean; updatedAt: string }>("/sync", {
      method: "PUT",
      auth: true,
      data: { data: getCurrentUserData() },
    });
    markCloudSynced();
    if (!options.silent) {
      uni.showToast({ title: "已上传云端", icon: "success" });
    }
  } catch (error) {
    if (!options.silent) {
      uni.showToast({ title: getErrorMessage(error), icon: "none" });
    }
  } finally {
    isSyncingCloud.value = false;
  }
}

async function pullCloudData(options: { silent?: boolean; confirm?: boolean } = {}) {
  if (!ensureCloudReady(Boolean(options.silent))) {
    return;
  }

  if (options.confirm !== false) {
    const confirmed = await confirmAction("从云端恢复", "会用云端备份覆盖当前本机数据，确定继续吗？", "恢复");
    if (!confirmed) {
      return;
    }
  }

  try {
    isSyncingCloud.value = true;
    const result = await requestCloud<CloudSyncResponse>("/sync", { auth: true });
    if (!result.data) {
      if (!options.silent) {
        uni.showToast({ title: "云端还没有备份", icon: "none" });
      }
      return;
    }

    isHydratingUserData.value = true;
    accounts.value = result.data.accounts || [];
    subscriptionReminders.value = result.data.subscriptionReminders || [];
    defaultHidePasswords.value = result.data.defaultHidePasswords ?? true;
    selectedSubscriptionAccountId.value = subscriptionAccounts.value[0]?.id || null;
    visiblePasswordIds.value = new Set();
    hiddenPasswordIds.value = new Set();
    persistCurrentUserData();
    if (currentUser.value) {
      uni.setStorageSync(getUserDataStorageKey(currentUser.value.username), getCurrentUserData());
    }
    markCloudSynced();
    if (!options.silent) {
      uni.showToast({ title: "已从云端恢复", icon: "success" });
    }
  } catch (error) {
    if (!options.silent) {
      uni.showToast({ title: getErrorMessage(error), icon: "none" });
    }
  } finally {
    setTimeout(() => {
      isHydratingUserData.value = false;
    }, 0);
    isSyncingCloud.value = false;
  }
}

function exportBackup() {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: getCurrentUserData(),
  };

  uni.setClipboardData({
    data: JSON.stringify(backup),
    success: () => {
      uni.showToast({ title: "备份已复制", icon: "success" });
    },
  });
}

function importBackup() {
  uni.getClipboardData({
    success: (result) => {
      const rawText = result.data?.trim() || "";
      if (!rawText) {
        uni.showToast({ title: "剪贴板为空", icon: "none" });
        return;
      }

      try {
        const parsed = JSON.parse(rawText);
        const data = parsed.data as Partial<UserData> | undefined;
        if (!data || !Array.isArray(data.accounts) || !Array.isArray(data.subscriptionReminders)) {
          uni.showToast({ title: "备份格式不正确", icon: "none" });
          return;
        }

        accounts.value = data.accounts as Account[];
        subscriptionReminders.value = data.subscriptionReminders as SubscriptionReminder[];
        defaultHidePasswords.value = data.defaultHidePasswords ?? true;
        selectedSubscriptionAccountId.value = subscriptionAccounts.value[0]?.id || null;
        visiblePasswordIds.value = new Set();
        hiddenPasswordIds.value = new Set();
        persistCurrentUserData();
        uni.showToast({ title: "导入成功", icon: "success" });
      } catch (error) {
        importSimpleAccounts(rawText);
      }
    },
  });
}

function importSimpleAccounts(rawText: string) {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 3 || lines.length % 3 !== 0) {
    uni.showToast({ title: "请按名称/账号/密码三行一组导入", icon: "none" });
    return;
  }

  const importedAccounts: Account[] = [];
  for (let index = 0; index < lines.length; index += 3) {
    const name = lines[index];
    const login = lines[index + 1];
    const password = lines[index + 2];
    importedAccounts.push({
      id: Date.now() + index,
      name,
      short: name.slice(0, 2).toUpperCase(),
      login,
      password,
      category: CATEGORY_PERSONAL,
      renewal: NO_RENEWAL,
      risk: "medium",
      issue: "文本导入",
      color: "#F3C84B",
      tags: [CATEGORY_PERSONAL],
    });
  }

  accounts.value = [...importedAccounts, ...accounts.value];
  persistCurrentUserData();
  uni.showToast({ title: `已导入 ${importedAccounts.length} 个账号`, icon: "success" });
}

function clearCurrentUserData() {
  uni.showModal({
    title: "清空数据",
    content: "确定要清空当前账号下的所有账号和订阅提醒吗？",
    confirmText: "清空",
    confirmColor: "#E46D5D",
    success: (result) => {
      if (!result.confirm) {
        return;
      }

      accounts.value = [];
      subscriptionReminders.value = [];
      selectedSubscriptionAccountId.value = null;
      visiblePasswordIds.value = new Set();
      hiddenPasswordIds.value = new Set();
      persistCurrentUserData();
      uni.showToast({ title: "已清空", icon: "success" });
    },
  });
}

function saveAccount() {
  if (!draft.name.trim()) {
    uni.showToast({ title: "请填写 App 名称", icon: "none" });
    return;
  }

  const category = normalizeCategory(draft.category);

  if (editingId.value) {
    const target = accounts.value.find((item) => item.id === editingId.value);
    if (target) {
      target.name = draft.name.trim();
      target.short = draft.name.trim().slice(0, 2).toUpperCase();
      target.login = draft.login.trim() || "未填写";
      target.password = draft.password;
      target.category = category;
      target.tags = [target.category];
      target.color = getCategoryColor(category, target.color);
    }
    uni.showToast({ title: "已保存", icon: "success" });
    closeForm();
    return;
  }

  accounts.value.unshift({
    id: Date.now(),
    name: draft.name.trim(),
    short: draft.name.trim().slice(0, 2).toUpperCase(),
    login: draft.login.trim() || "未填写",
    password: draft.password,
    category,
    renewal: NO_RENEWAL,
    risk: "medium",
    issue: "手动添加",
    color: getCategoryColor(category),
    tags: [category],
  });

  uni.showToast({ title: "已添加", icon: "success" });
  closeForm();
}
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at -10% 24%, rgba(143, 203, 155, 0.44), transparent 28%),
    radial-gradient(circle at 112% 6%, rgba(243, 200, 75, 0.5), transparent 32%),
    #fbf8ef;
  color: #161616;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display",
    "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.auth-screen {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  justify-content: flex-start;
  padding: 168rpx 64rpx 48rpx;
}

.auth-brand {
  margin-bottom: 56rpx;
}

.auth-kicker {
  display: block;
  color: #9f6800;
  font-size: 28rpx;
  font-weight: 900;
}

.auth-title {
  display: block;
  margin-top: 22rpx;
  color: #121212;
  font-size: 62rpx;
  font-weight: 900;
  line-height: 1.05;
}

.auth-copy {
  display: block;
  width: 100%;
  margin-top: 28rpx;
  color: #6e6a63;
  font-size: 30rpx;
  line-height: 1.55;
}

.auth-card {
  padding: 36rpx;
  border: 1rpx solid rgba(33, 74, 135, 0.08);
  border-radius: 34rpx;
  background: rgba(255, 253, 247, 0.94);
  box-shadow: 0 22rpx 56rpx rgba(38, 35, 28, 0.1);
}

.auth-tabs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8rpx;
  margin-bottom: 30rpx;
  padding: 6rpx;
  border-radius: 22rpx;
  background: #f5f0e6;
}

.auth-tab {
  display: flex;
  height: 62rpx;
  align-items: center;
  justify-content: center;
  border-radius: 18rpx;
  color: #6e6a63;
  font-size: 25rpx;
  font-weight: 900;
}

.auth-tab.active {
  background: #fffdf7;
  color: #214a87;
  box-shadow: 0 4rpx 12rpx rgba(38, 35, 28, 0.08);
}

.auth-label {
  display: block;
  margin: 28rpx 0 12rpx;
  color: #6e6a63;
  font-size: 26rpx;
  font-weight: 900;
}

.auth-field {
  margin-top: 0;
  height: 86rpx;
  border-radius: 24rpx;
  background: #f3f1f4;
  font-size: 28rpx;
}

.auth-submit {
  margin-top: 34rpx;
  background: #f3b74c;
  color: #121212;
  box-shadow: 0 14rpx 30rpx rgba(243, 183, 76, 0.24);
}

.auth-hint {
  display: block;
  margin-top: 28rpx;
  color: #6e6a63;
  font-size: 25rpx;
  text-align: center;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 62rpx 32rpx 24rpx;
}

.hello {
  display: block;
  color: #121212;
  font-size: 38rpx;
  font-weight: 900;
  line-height: 1.1;
}

.card-label,
.portfolio-note,
.metric-label,
.row-sub,
.mini-label,
.section-link {
  display: block;
  color: #6e6a63;
  font-size: 23rpx;
  line-height: 1.4;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-right: 28rpx;
}

.avatar-button {
  width: 58rpx;
  height: 58rpx;
  border-radius: 18rpx;
  margin: 0;
  padding: 0;
  line-height: 58rpx;
  font-weight: 900;
}

.avatar-button {
  background: #214a87;
  color: #f8d769;
}

.page-scroll {
  height: calc(100vh - 144rpx);
}

.screen {
  padding: 0 30rpx 188rpx;
}

.portfolio-card,
.metric-card,
.list-card,
.search-card,
.form-card,
.account-card {
  border: 1rpx solid rgba(33, 74, 135, 0.08);
  border-radius: 30rpx;
  background: rgba(255, 253, 247, 0.94);
  box-shadow: 0 18rpx 42rpx rgba(38, 35, 28, 0.08);
}

.portfolio-card {
  padding: 30rpx 0 0;
  overflow: hidden;
}

.card-head,
.section-row,
.account-head,
.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-head {
  padding: 0 30rpx;
}

.mini-add,
.text-button {
  height: 52rpx;
  border-radius: 18rpx;
  background: #f6d76b;
  color: #214a87;
  font-size: 23rpx;
  font-weight: 900;
  line-height: 52rpx;
  margin: 0;
  padding: 0 20rpx;
}

.portfolio-number {
  display: block;
  margin-top: 26rpx;
  padding: 0 30rpx;
  color: #151515;
  font-size: 74rpx;
  font-weight: 900;
  line-height: 1;
}

.portfolio-note {
  padding: 8rpx 30rpx 28rpx;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14rpx;
  margin-top: 14rpx;
}

.metric-card {
  min-height: 132rpx;
  padding: 26rpx;
}

.metric-value {
  display: block;
  margin-top: 8rpx;
  color: #214a87;
  font-size: 34rpx;
  font-weight: 900;
}

.section-row {
  margin: 34rpx 4rpx 14rpx;
}

.section-row.first,
.section-row.compact {
  margin-top: 0;
}

.section-title {
  color: #121212;
  font-size: 33rpx;
  font-weight: 900;
}

.list-card {
  overflow: hidden;
}

.list-row {
  display: flex;
  min-height: 108rpx;
  align-items: center;
  gap: 18rpx;
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid rgba(33, 74, 135, 0.1);
}

.list-row:last-child {
  border-bottom: 0;
}

.empty-row {
  padding: 34rpx 24rpx;
  color: #6e6a63;
  font-size: 25rpx;
  text-align: center;
}

.empty-card {
  padding: 38rpx 24rpx;
  border: 1rpx solid rgba(33, 74, 135, 0.08);
  border-radius: 30rpx;
  background: rgba(255, 253, 247, 0.94);
  box-shadow: 0 18rpx 42rpx rgba(38, 35, 28, 0.08);
  text-align: center;
}

.empty-title,
.empty-copy {
  display: block;
}

.empty-title {
  color: #121212;
  font-size: 29rpx;
  font-weight: 900;
}

.empty-copy {
  margin-top: 10rpx;
  color: #6e6a63;
  font-size: 24rpx;
}

.app-token,
.date-token,
.setting-token {
  display: flex;
  width: 66rpx;
  height: 66rpx;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 18rpx;
  color: #fffdf7;
  font-size: 22rpx;
  font-weight: 900;
}

.app-token.large {
  width: 78rpx;
  height: 78rpx;
}

.date-token,
.setting-token {
  background: #214a87;
  color: #f8d769;
  font-size: 20rpx;
}

.setting-token.green {
  background: #8fcb9b;
  color: #173a72;
}

.setting-token.yellow {
  background: #f8d769;
  color: #173a72;
}

.setting-token.red {
  background: #e46d5d;
  color: #fffdf7;
}

.setting-value {
  flex: 0 0 auto;
  color: #6e6a63;
  font-size: 22rpx;
  font-weight: 800;
}

.row-main {
  min-width: 0;
  flex: 1;
}

.row-title {
  display: block;
  color: #121212;
  font-size: 29rpx;
  font-weight: 900;
  line-height: 1.3;
}

.row-sub {
  margin-top: 5rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.soft-pill {
  flex: 0 0 auto;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(143, 203, 155, 0.28);
  color: #214a87;
  font-size: 21rpx;
  font-weight: 900;
}

.soft-pill.navy {
  background: rgba(33, 74, 135, 0.1);
}

.search-card,
.form-card,
.account-card {
  padding: 22rpx;
}

.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx 30rpx;
  background: rgba(22, 22, 22, 0.28);
  -webkit-backdrop-filter: blur(10rpx);
  backdrop-filter: blur(10rpx);
}

.modal-card {
  width: 100%;
  max-height: 74vh;
  overflow-y: auto;
  padding: 26rpx;
  border: 1rpx solid rgba(33, 74, 135, 0.08);
  border-radius: 34rpx;
  background: rgba(255, 253, 247, 0.98);
  box-shadow: 0 24rpx 70rpx rgba(38, 35, 28, 0.22);
}

.search-box,
.field {
  display: flex;
  align-items: center;
  height: 74rpx;
  border-radius: 20rpx;
  background: #f5f0e6;
  padding: 0 20rpx;
}

.search-symbol {
  width: 40rpx;
  color: #214a87;
  font-size: 30rpx;
}

.search-input,
.field {
  flex: 1;
  color: #121212;
  font-size: 25rpx;
}

.segmented {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin-top: 16rpx;
  padding: 5rpx;
  border-radius: 20rpx;
  background: #f5f0e6;
}

.segment {
  display: flex;
  height: 56rpx;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  color: #6e6a63;
  font-size: 23rpx;
  font-weight: 900;
}

.segment.active {
  background: #fffdf7;
  color: #214a87;
  box-shadow: 0 4rpx 12rpx rgba(38, 35, 28, 0.08);
}

.form-card,
.account-list {
  margin-top: 18rpx;
}

.subscription-select {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 14rpx;
}

.subscription-option {
  display: flex;
  min-height: 58rpx;
  align-items: center;
  justify-content: center;
  border-radius: 18rpx;
  background: #f5f0e6;
  color: #6e6a63;
  font-size: 24rpx;
  font-weight: 900;
  padding: 0 20rpx;
}

.subscription-option.active {
  background: #214a87;
  color: #fffdf7;
}

.category-picker {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
  margin-top: 14rpx;
}

.category-chip {
  min-width: 0;
  padding: 16rpx 12rpx;
  border: 1rpx solid rgba(33, 74, 135, 0.08);
  border-radius: 20rpx;
  background: #f5f0e6;
  color: #6e6a63;
  text-align: center;
}

.category-chip.active {
  background: #214a87;
  color: #fffdf7;
  box-shadow: 0 10rpx 20rpx rgba(33, 74, 135, 0.18);
}

.category-chip-title,
.category-chip-hint {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-chip-title {
  font-size: 25rpx;
  font-weight: 900;
}

.category-chip-hint {
  margin-top: 5rpx;
  font-size: 19rpx;
  opacity: 0.72;
}

.field {
  width: 100%;
  margin-top: 12rpx;
}

.primary-button {
  width: 100%;
  height: 86rpx;
  border-radius: 22rpx;
  background: #1b1b1b;
  color: #fffdf7;
  font-size: 28rpx;
  font-weight: 900;
  line-height: 86rpx;
  margin: 18rpx 0 0;
}

.account-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.account-head {
  gap: 18rpx;
}

.card-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 8rpx;
}

.small-action {
  height: 50rpx;
  border-radius: 16rpx;
  background: rgba(33, 74, 135, 0.1);
  color: #214a87;
  font-size: 21rpx;
  font-weight: 900;
  line-height: 50rpx;
  margin: 0;
  padding: 0 14rpx;
}

.small-action.danger {
  background: rgba(228, 109, 93, 0.13);
  color: #d24d3f;
}

.logout-button {
  height: 54rpx;
  border-radius: 18rpx;
  background: rgba(228, 109, 93, 0.13);
  color: #d24d3f;
  font-size: 23rpx;
  font-weight: 900;
  line-height: 54rpx;
  margin: 0;
  padding: 0 18rpx;
}

.password-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-top: 20rpx;
  padding: 18rpx;
  border-radius: 22rpx;
  background: #f5f0e6;
}

.password-main {
  min-width: 0;
  flex: 1;
}

.mini-label.left {
  text-align: left;
}

.password-text {
  display: block;
  margin-top: 6rpx;
  overflow: hidden;
  color: #121212;
  font-size: 29rpx;
  font-weight: 900;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.password-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 10rpx;
}

.password-button {
  height: 56rpx;
  border-radius: 18rpx;
  background: rgba(33, 74, 135, 0.1);
  color: #214a87;
  font-size: 23rpx;
  font-weight: 900;
  line-height: 56rpx;
  margin: 0;
  padding: 0 18rpx;
}

.password-button.dark {
  background: #214a87;
  color: #fffdf7;
}

.chevron {
  color: #214a87;
  font-size: 46rpx;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
  margin-top: 20rpx;
  padding-top: 18rpx;
  border-top: 1rpx solid rgba(33, 74, 135, 0.1);
}

.mini-label,
.mini-value {
  display: block;
  text-align: center;
}

.mini-value {
  margin-top: 5rpx;
  color: #121212;
  font-size: 22rpx;
  font-weight: 900;
}

.tabbar {
  position: fixed;
  right: 28rpx;
  bottom: 28rpx;
  left: 28rpx;
  z-index: 8;
  display: grid;
  grid-template-columns: 1.15fr 1fr 1.18fr 1fr 1fr;
  gap: 8rpx;
  min-height: 126rpx;
  padding: 10rpx 12rpx;
  border: 1rpx solid rgba(33, 74, 135, 0.08);
  border-radius: 68rpx;
  background: rgba(255, 253, 247, 0.94);
  box-shadow: 0 20rpx 48rpx rgba(38, 35, 28, 0.18);
  -webkit-backdrop-filter: blur(36rpx);
  backdrop-filter: blur(36rpx);
}

.tab-item {
  display: flex;
  height: 106rpx;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 54rpx;
  color: #161616;
}

.tab-item.active {
  background: #eef1e9;
  color: #214a87;
}

.create-button {
  display: flex;
  width: 118rpx;
  height: 72rpx;
  align-items: center;
  justify-content: center;
  border-radius: 38rpx;
  background: #214a87;
  color: #f8d769;
  box-shadow: 0 12rpx 26rpx rgba(33, 74, 135, 0.24);
}

.create-button text {
  font-size: 56rpx;
  line-height: 1;
  transform: translateY(-2rpx);
}

.tab-icon {
  display: block;
  height: 34rpx;
  font-size: 31rpx;
  font-weight: 900;
  line-height: 34rpx;
}

.tab-text {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  font-weight: 900;
}
</style>
