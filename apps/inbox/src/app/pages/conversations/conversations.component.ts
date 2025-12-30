import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InboxService, Conversation } from '../../services/inbox.service';

@Component({
  selector: 'app-conversations',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './conversations.component.html',
  styleUrls: ['./conversations.component.scss']
})
export class ConversationsComponent implements OnInit {
  conversations: Conversation[] = [];
  loading = true;

  constructor(private inboxService: InboxService) {}

  ngOnInit() {
    this.loadConversations();
  }

  loadConversations() {
    this.inboxService.getConversations().subscribe({
      next: (data) => {
        this.conversations = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando conversaciones:', error);
        this.loading = false;
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

