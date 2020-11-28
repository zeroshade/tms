<template>
  <v-container>
    <v-card class='elevation=1'>
      <v-form ref='userform' v-model='valid' lazy-validation>
        <v-card-title class='headline'>Add User</v-card-title>
        <v-divider />
        <v-card-text>
          <v-alert prominent type="error" v-if="error !== ''">
            <v-row align="center">
              <v-col class="grow">
                <strong>Error Adding User:</strong>
                {{error}}
              </v-col>
            </v-row>
          </v-alert>
            <v-layout wrap>
              <v-flex xs12 md4>
                <v-text-field v-model='name'
                  :rules='[(v) => !!v || "Cannot be empty"]'
                  label='Name' />
              </v-flex>
              <v-flex xs12 offset-md1 md4>
                <v-text-field v-model='username'
                  :rules='[(v) => !!v || "Cannot be empty"]'
                  label='Username' />
              </v-flex>
              <v-flex xs12 md4>
                <v-text-field v-model='email'
                  :rules='[(v) => !!v || "Cannot be empty"]'
                  label='Email' />
              </v-flex>
              <v-flex xs12 offset-md1 md4>
                <v-text-field v-model='password'
                  :rules='[(v) => !!v || "Cannot be empty"]'
                  label='Password'
                  type='password' />
              </v-flex>
            </v-layout>
        </v-card-text>
        <v-card-actions>
          <v-btn color='error' @click='reset'>Reset Form</v-btn>
          <v-spacer />
          <v-btn @click='save' :disabled='loading' color='success'>Save</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-container>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import { User } from '@/api/users';
import { Action } from 'vuex-class';

@Component
export default class AddUser extends Vue {
  @Action('auth/addUser') public addUser!: (u: User) => Promise<null|string>;

  public loading = false;
  public name = '';
  public username = '';
  public password = '';
  public email = '';
  public valid = true;
  public error = '';

  public reset() {
    (this.$refs.userform as HTMLFormElement).reset();
  }

  public async save() {
    this.loading = true;
    if ((this.$refs.userform as HTMLFormElement).validate()) {
      const res = await this.addUser({name: this.name, email: this.email, user_id: '', password: this.password,
        username: this.username, app_metadata: { role: 'captain' } });
      if (res === null) {
        this.$router.push({ name: 'userhome' });
      } else {
        this.error = res;
      }
    }
    this.loading = false;
  }
}
</script>
