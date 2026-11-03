import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicacionItem } from '../../../core/services/publicaciones';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-card.html',
  styleUrl: './post-card.scss',
})
export class PostCardComponent {
  post = input.required<PublicacionItem>();
  currentUserId = input<string | null>(null);
  isAdmin = input<boolean>(false);
  showComments = input<boolean>(false);

  toggleLike = output<PublicacionItem>();
  requestDelete = output<PublicacionItem>();

  defaultAvatar = 'https://ui-avatars.com/api/?name=Coleccionista&background=8c5a32&color=fff';

  isLiked = computed(() => {
    const uid = this.currentUserId();
    if (!uid) return false;
    return this.post().likes.some((id) => id === uid);
  });

  canDelete = computed(() => {
    const uid = this.currentUserId();
    if (!uid) return false;
    return this.post().usuario?._id === uid || this.isAdmin();
  });

  onLikeClick() {
    this.toggleLike.emit(this.post());
  }

  onDeleteClick() {
    this.requestDelete.emit(this.post());
  }
}
