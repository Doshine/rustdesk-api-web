<template>
  <div class="control-page identity-editor">
    <YjPageHeader
        eyebrow="IDENTITY POLICY"
        :title="isEdit ? T('UserEdit') : T('UserAdd')"
        :description="T('UserAccessDescription')"
    >
      <template #actions>
        <el-button @click="cancel">{{ T('Cancel') }}</el-button>
        <el-button type="primary" @click="submitForm">{{ T('SaveChanges') }}</el-button>
      </template>
    </YjPageHeader>

    <el-form ref="root" :model="form" :rules="rules" label-position="top" class="identity-layout">
      <main class="identity-layout__main">
        <section class="identity-section">
          <div class="identity-section__heading">
            <span class="identity-section__index">01</span>
            <span>
              <strong>{{ T('AccountIdentity') }}</strong>
              <small>{{ T('AccountIdentityDescription') }}</small>
            </span>
          </div>
          <div class="field-grid">
            <el-form-item :label="T('Username')" prop="username">
              <el-input v-model="form.username"/>
            </el-form-item>
            <el-form-item :label="T('Email')" prop="email">
              <el-input v-model="form.email"/>
            </el-form-item>
            <el-form-item :label="T('Nickname')" prop="nickname">
              <el-input v-model="form.nickname"/>
            </el-form-item>
            <el-form-item :label="T('Group')" prop="group_id">
              <el-select v-model="form.group_id" filterable>
                <el-option
                    v-for="item in groupsList"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                />
              </el-select>
            </el-form-item>
          </div>
        </section>

        <section class="identity-section">
          <div class="identity-section__heading">
            <span class="identity-section__index">02</span>
            <span>
              <strong>{{ T('AccessPolicy') }}</strong>
              <small>{{ T('AccessPolicyDescription') }}</small>
            </span>
          </div>

          <el-radio-group v-model="form.role" class="role-grid" :disabled="form.role === 'owner'">
            <el-radio
                v-for="role in availableRoles"
                :key="role.value"
                :value="role.value"
                class="role-option"
            >
              <span class="role-option__body">
                <span class="role-option__title">
                  <span>{{ role.title }}</span>
                  <code>{{ role.value }}</code>
                </span>
                <small>{{ role.description }}</small>
              </span>
            </el-radio>
          </el-radio-group>

          <div class="security-boundary-note">
            <el-icon><Lock/></el-icon>
            <span>{{ T('RoleSecurityNote') }}</span>
          </div>
        </section>

        <section class="identity-section identity-section--compact">
          <div class="identity-section__heading">
            <span class="identity-section__index">03</span>
            <span>
              <strong>{{ T('AccountLifecycle') }}</strong>
              <small>{{ T('AccountLifecycleDescription') }}</small>
            </span>
          </div>
          <div class="field-grid">
            <el-form-item :label="T('Status')" prop="status">
              <div class="lifecycle-control">
                <el-switch
                    v-model="form.status"
                    :active-value="ENABLE_STATUS"
                    :inactive-value="DISABLE_STATUS"
                />
                <span>{{ form.status === ENABLE_STATUS ? T('Enable') : T('Disable') }}</span>
              </div>
            </el-form-item>
            <el-form-item :label="T('Remark')" prop="remark">
              <el-input v-model="form.remark"/>
            </el-form-item>
          </div>
        </section>
      </main>

      <aside class="identity-layout__aside">
        <div class="policy-summary">
          <span class="policy-summary__eyebrow">{{ T('SelectedRoleSummary') }}</span>
          <div class="policy-summary__role">
            <el-icon><Key/></el-icon>
            <span>
              <strong>{{ selectedRole.title }}</strong>
              <code>{{ selectedRole.value }}</code>
            </span>
          </div>
          <p>{{ selectedRole.description }}</p>
          <div class="policy-summary__capabilities">
            <span v-for="capability in selectedRole.capabilities" :key="capability">
              <el-icon><Check/></el-icon>{{ capability }}
            </span>
          </div>
          <div class="policy-summary__group">
            <span>{{ T('NavigationPolicy') }}</span>
            <strong>{{ selectedGroupName || T('NotConfigured') }}</strong>
            <small>{{ T('GroupNavigationHint') }}</small>
          </div>
        </div>
      </aside>
    </el-form>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import { useGetDetail, useSubmit } from '@/views/user/composables/edit'
  import { DISABLE_STATUS, ENABLE_STATUS } from '@/utils/common_options'
  import { T } from '@/utils/i18n'
  import { Check, Key, Lock } from '@element-plus/icons-vue'
  import YjPageHeader from '@/components/yj/YjPageHeader.vue'

  const route = useRoute()
  const isEdit = computed(() => Number(route.params.id) > 0)
  const { form, groupsList } = useGetDetail(route.params.id)
  const { root, rules, submit, cancel } = useSubmit(form, route.params.id)

  const roleOptions = computed(() => [
    {
      value: 'admin',
      title: T('RoleAdminTitle'),
      description: T('RoleAdminDescription'),
      capabilities: [T('PermissionFullAdmin'), T('PermissionAuditRead'), T('PermissionDeviceManage')],
    },
    {
      value: 'auditor',
      title: T('RoleAuditorTitle'),
      description: T('RoleAuditorDescription'),
      capabilities: [T('PermissionAuditRead')],
    },
    {
      value: 'operator',
      title: T('RoleOperatorTitle'),
      description: T('RoleOperatorDescription'),
      capabilities: [T('PermissionAuditRead')],
    },
    {
      value: 'user',
      title: T('RoleUserTitle'),
      description: T('RoleUserDescription'),
      capabilities: [T('PermissionSelfService')],
    },
  ])
  const ownerRole = computed(() => ({
    value: 'owner',
    title: T('RoleOwnerTitle'),
    description: T('RoleOwnerDescription'),
    capabilities: [T('PermissionFullAdmin'), T('PermissionAuditRead'), T('PermissionDeviceManage')],
  }))
  const availableRoles = computed(() =>
    form.value.role === 'owner' ? [ownerRole.value] : roleOptions.value)
  const selectedRole = computed(() =>
    [...roleOptions.value, ownerRole.value].find(role => role.value === form.value.role) || roleOptions.value[3])
  const selectedGroupName = computed(() =>
    groupsList.value.find(group => group.id === form.value.group_id)?.name || '')

  const submitForm = () => {
    form.value.is_admin = ['owner', 'admin'].includes(form.value.role)
    submit()
  }
</script>

<style scoped lang="scss">
.identity-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  align-items: start;
  gap: var(--yj-spacing-xl);

  &__main {
    display: grid;
    gap: var(--yj-spacing-lg);
  }

  &__aside {
    position: sticky;
    top: var(--yj-spacing-xl);
  }
}

.identity-section,
.policy-summary {
  border: 1px solid var(--yj-border);
  border-radius: var(--yj-radius-lg);
  background: var(--yj-surface);
}

.identity-section {
  padding: var(--yj-spacing-xl);

  &__heading {
    display: flex;
    align-items: flex-start;
    gap: var(--yj-spacing-md);
    margin-bottom: var(--yj-spacing-xl);

    > span:last-child {
      display: flex;
      flex-direction: column;
      gap: var(--yj-spacing-xs);
    }

    strong {
      color: var(--yj-text-primary);
      font-size: var(--yj-font-size-md);
      font-weight: var(--yj-font-weight-semibold);
    }

    small {
      color: var(--yj-text-tertiary);
      font-size: var(--yj-font-size-sm);
      line-height: var(--yj-line-height-base);
    }
  }

  &__index {
    color: var(--yj-primary);
    font-family: var(--yj-font-family-mono);
    font-size: var(--yj-font-size-sm);
    font-weight: var(--yj-font-weight-semibold);
    letter-spacing: .08em;
  }
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 var(--yj-spacing-lg);
}

.role-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--yj-spacing-md);
  width: 100%;
}

.role-option {
  display: flex;
  align-items: flex-start;
  min-height: 104px;
  height: auto;
  margin: 0 !important;
  padding: var(--yj-spacing-lg);
  border: 1px solid var(--yj-border);
  border-radius: var(--yj-radius-md);
  background: var(--yj-surface);
  transition: border-color var(--yj-duration-fast) var(--yj-easing-standard),
    background-color var(--yj-duration-fast) var(--yj-easing-standard);

  &:hover,
  &.is-checked {
    border-color: var(--yj-primary);
    background: var(--yj-surface-selected);
  }

  :deep(.el-radio__input) {
    margin-top: 3px;
  }

  :deep(.el-radio__label) {
    min-width: 0;
    padding-left: var(--yj-spacing-md);
    white-space: normal;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: var(--yj-spacing-sm);
  }

  &__title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--yj-spacing-sm);
    color: var(--yj-text-primary);
    font-weight: var(--yj-font-weight-semibold);

    code {
      color: var(--yj-text-tertiary);
      font-family: var(--yj-font-family-mono);
      font-size: var(--yj-font-size-xs);
      font-weight: var(--yj-font-weight-regular);
    }
  }

  small {
    color: var(--yj-text-tertiary);
    font-size: var(--yj-font-size-sm);
    line-height: var(--yj-line-height-base);
  }
}

.security-boundary-note {
  display: flex;
  align-items: flex-start;
  gap: var(--yj-spacing-sm);
  margin-top: var(--yj-spacing-lg);
  padding: var(--yj-spacing-md) var(--yj-spacing-lg);
  border-left: 2px solid var(--yj-primary);
  background: var(--yj-surface-hover);
  color: var(--yj-text-secondary);
  font-size: var(--yj-font-size-sm);
  line-height: var(--yj-line-height-base);

  .el-icon {
    flex: none;
    margin-top: 2px;
    color: var(--yj-primary);
  }
}

.lifecycle-control {
  display: flex;
  align-items: center;
  min-height: 32px;
  gap: var(--yj-spacing-md);
  color: var(--yj-text-secondary);
}

.policy-summary {
  overflow: hidden;

  &__eyebrow {
    display: block;
    padding: var(--yj-spacing-md) var(--yj-spacing-lg);
    border-bottom: 1px solid var(--yj-divider);
    background: var(--yj-surface-hover);
    color: var(--yj-text-tertiary);
    font-size: var(--yj-font-size-xs);
    font-weight: var(--yj-font-weight-semibold);
    letter-spacing: .1em;
    text-transform: uppercase;
  }

  &__role {
    display: flex;
    align-items: center;
    gap: var(--yj-spacing-md);
    padding: var(--yj-spacing-xl) var(--yj-spacing-xl) var(--yj-spacing-md);

    > .el-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--yj-radius-md);
      background: var(--yj-primary-subtle);
      color: var(--yj-primary);
    }

    > span {
      display: flex;
      flex-direction: column;
      gap: var(--yj-spacing-xxs);
    }

    strong {
      color: var(--yj-text-primary);
      font-size: var(--yj-font-size-md);
    }

    code {
      color: var(--yj-text-tertiary);
      font-family: var(--yj-font-family-mono);
      font-size: var(--yj-font-size-xs);
    }
  }

  > p {
    margin: 0;
    padding: 0 var(--yj-spacing-xl) var(--yj-spacing-lg);
    color: var(--yj-text-secondary);
    font-size: var(--yj-font-size-sm);
    line-height: var(--yj-line-height-base);
  }

  &__capabilities {
    display: grid;
    gap: var(--yj-spacing-sm);
    padding: var(--yj-spacing-lg) var(--yj-spacing-xl);
    border-top: 1px solid var(--yj-divider);

    span {
      display: flex;
      align-items: center;
      gap: var(--yj-spacing-sm);
      color: var(--yj-text-secondary);
      font-size: var(--yj-font-size-sm);
    }

    .el-icon {
      color: var(--yj-success);
    }
  }

  &__group {
    display: flex;
    padding: var(--yj-spacing-lg) var(--yj-spacing-xl);
    border-top: 1px solid var(--yj-divider);
    background: var(--yj-surface-hover);
    flex-direction: column;
    gap: var(--yj-spacing-xs);

    span,
    small {
      color: var(--yj-text-tertiary);
      font-size: var(--yj-font-size-xs);
    }

    strong {
      color: var(--yj-text-primary);
      font-size: var(--yj-font-size-sm);
    }

    small {
      line-height: var(--yj-line-height-base);
    }
  }
}

@media (max-width: 1024px) {
  .identity-layout {
    grid-template-columns: 1fr;

    &__aside {
      position: static;
      order: -1;
    }
  }
}

@media (max-width: 768px) {
  .field-grid,
  .role-grid {
    grid-template-columns: 1fr;
  }

  .identity-section {
    padding: var(--yj-spacing-lg);
  }
}
</style>
