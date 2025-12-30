import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InboxService, Message, Conversation } from '../../services/inbox.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  conversationId!: number;
  conversation!: Conversation;
  messages: Message[] = [];
  newMessage = '';
  loading = true;
  sending = false;

  constructor(
    private route: ActivatedRoute,
    private inboxService: InboxService
  ) {}

  ngOnInit() {
    this.conversationId = parseInt(this.route.snapshot.paramMap.get('id') || '0');
    this.loadConversation();
    this.loadMessages();
  }

  loadConversation() {
    this.inboxService.getConversations().subscribe({
      next: (conversations) => {
        this.conversation = conversations.find(c => c.id === this.conversationId)!;
      },
      error: (error) => {
        console.error('Error cargando conversación:', error);
      }
    });
  }

  loadMessages() {
    this.loading = true;
    this.inboxService.getMessages(this.conversationId).subscribe({
      next: (data) => {
        this.messages = data;
        this.loading = false;
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Error cargando mensajes:', error);
        this.loading = false;
      }
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || this.sending) return;

    if (!this.conversation || !this.conversation.phone_number) {
      alert('No se puede determinar el número de teléfono');
      return;
    }

    this.sending = true;
    this.inboxService.sendMessage(this.conversation.phone_number, this.newMessage).subscribe({
      next: () => {
        this.newMessage = '';
        this.sending = false;
        this.loadMessages();
      },
      error: (error) => {
        console.error('Error enviando mensaje:', error);
        alert('Error al enviar mensaje');
        this.sending = false;
      }
    });
  }

  scrollToBottom() {
    const container = document.querySelector('.messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

