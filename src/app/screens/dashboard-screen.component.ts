import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { RouteMapComponent } from '../core/route-map.component';
import type { EnrutaState } from '../core/enruta-state.service';

@Component({
  selector: 'app-dashboard-screen',
  standalone: true,
  imports: [FormsModule, RouteMapComponent],
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './dashboard-screen.component.html',
})
export class DashboardScreenComponent implements OnInit {
  @Input({ required: true }) app!: EnrutaState;

  ngOnInit(): void {
    void this.app.refreshOverviewRoutes();
  }
}
