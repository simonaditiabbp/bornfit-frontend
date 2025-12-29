export const  isBirthdayToday = (dateString) => {
  if (!dateString) return false;
  const today = new Date();
  const dob = new Date(dateString);

  return (
    today.getDate() === dob.getDate() &&
    today.getMonth() === dob.getMonth()
  );
}
