import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

interface HelloResponse {
  message: string;
  timeUtc: string;
}

@Component({
  selector: 'app-root',
  imports: [DatePipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly http = inject(HttpClient);

  protected readonly hello = signal<HelloResponse | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);

  callApi(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<HelloResponse>(`${environment.apiBaseUrl}/api/hello`).subscribe({
      next: (response) => {
        this.hello.set(response);
        this.loading.set(false);
      },
      error: (err) => {
        this.hello.set(null);
        this.error.set(err.message ?? 'Request failed');
        this.loading.set(false);
      },
    });
  }
}
