import { ValidateFormDirective } from './core/validate-form.directive';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EnrutaState } from './core/enruta-state.service';
import { ScreenBoundaryComponent } from './core/screen-boundary.component';
import { LoginScreenComponent } from './screens/login-screen.component';
import { VerifyScreenComponent } from './screens/verify-screen.component';
import { RecoverScreenComponent } from './screens/recover-screen.component';
import { ResetScreenComponent } from './screens/reset-screen.component';
import { RegisterScreenComponent } from './screens/register-screen.component';
import { PlanScreenComponent } from './screens/plan-screen.component';
import { SubmittedScreenComponent } from './screens/submitted-screen.component';
import { PermissionScreenComponent } from './screens/permission-screen.component';
import { ExpiredScreenComponent } from './screens/expired-screen.component';
import { DashboardScreenComponent } from './screens/dashboard-screen.component';
import { RoutesScreenComponent } from './screens/routes-screen.component';
import { PlannerScreenComponent } from './screens/planner-screen.component';
import { ApprovalsScreenComponent } from './screens/approvals-screen.component';
import { ReportsScreenComponent } from './screens/reports-screen.component';
import { SettlementsScreenComponent } from './screens/settlements-screen.component';
import { AuditScreenComponent } from './screens/audit-screen.component';
import { ConfigurationScreenComponent } from './screens/configuration-screen.component';
import { ParametersScreenComponent } from './screens/parameters-screen.component';
import { FormsScreenComponent } from './screens/forms-screen.component';
import { PublishScreenComponent } from './screens/publish-screen.component';
import { BrandScreenComponent } from './screens/brand-screen.component';
import { IntegrationsScreenComponent } from './screens/integrations-screen.component';
import { ImportScreenComponent } from './screens/import-screen.component';
import { ProductsScreenComponent } from './screens/products-screen.component';
import { ClientsScreenComponent } from './screens/clients-screen.component';
import { PricesScreenComponent } from './screens/prices-screen.component';
import { UsersScreenComponent } from './screens/users-screen.component';
import { DevicesScreenComponent } from './screens/devices-screen.component';
import { ProfileScreenComponent } from './screens/profile-screen.component';
import { NotificationsScreenComponent } from './screens/notifications-screen.component';
import { ContextScreenComponent } from './screens/context-screen.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, ScreenBoundaryComponent, ValidateFormDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly state = inject(EnrutaState);
  readonly screens = {
    login: LoginScreenComponent,
    verify: VerifyScreenComponent,
    recover: RecoverScreenComponent,
    reset: ResetScreenComponent,
    register: RegisterScreenComponent,
    plan: PlanScreenComponent,
    submitted: SubmittedScreenComponent,
    permission: PermissionScreenComponent,
    expired: ExpiredScreenComponent,
    dashboard: DashboardScreenComponent,
    routes: RoutesScreenComponent,
    planner: PlannerScreenComponent,
    approvals: ApprovalsScreenComponent,
    reports: ReportsScreenComponent,
    settlements: SettlementsScreenComponent,
    audit: AuditScreenComponent,
    configuration: ConfigurationScreenComponent,
    parameters: ParametersScreenComponent,
    forms: FormsScreenComponent,
    publish: PublishScreenComponent,
    brand: BrandScreenComponent,
    integrations: IntegrationsScreenComponent,
    import: ImportScreenComponent,
    products: ProductsScreenComponent,
    clients: ClientsScreenComponent,
    prices: PricesScreenComponent,
    users: UsersScreenComponent,
    devices: DevicesScreenComponent,
    profile: ProfileScreenComponent,
    notifications: NotificationsScreenComponent,
    context: ContextScreenComponent,
  };
}
