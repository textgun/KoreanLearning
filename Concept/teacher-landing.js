// 교사용 랜딩페이지 시안의 참여 안내 대화상자를 제어한다.
const joinDialog = document.querySelector('#join-dialog');
document.querySelectorAll('[data-join]').forEach(button => {
  button.addEventListener('click', () => joinDialog.showModal());
});
document.querySelectorAll('.close-dialog, .close-action').forEach(button => {
  button.addEventListener('click', () => joinDialog.close());
});
joinDialog.addEventListener('click', event => {
  if (event.target === joinDialog) {
    const bounds = joinDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) joinDialog.close();
  }
});
