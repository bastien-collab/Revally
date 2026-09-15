import CreateRestaurantForm from "@/components/admin/CreateRestaurantForm";

export default function NewRestaurantPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Nouveau restaurant</h1>
        <p className="mt-1 text-sm font-medium text-ink-soft">
          La roue est créée avec les 4 lots par défaut — vous pourrez les personnaliser ensuite depuis la fiche du
          restaurant.
        </p>
      </div>
      <CreateRestaurantForm />
    </div>
  );
}
