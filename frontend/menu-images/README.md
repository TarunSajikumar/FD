# Menu Images Folder

This folder contains all the food advertisement images shown on the Menu page.

## Image Files

| File | Used For |
|------|---------|
| biryani.png | All Biryani items |
| momo.png | All Momo items |
| chilli-chicken.png | Chilli Chicken |
| chicken-65.png | Chicken 65 |
| chicken-lollipop.png | Chicken Lollipop |
| chicken-kabab.png | Chicken Kabab |
| butter-chicken.png | Butter Chicken, Chicken Masala, Chicken Curry |
| noodles.png | All Noodles items |
| paneer-curry.png | All Veg Curry items |
| fried-rice.png | All Rice items |
| meals.png | Meals |
| default.png | Fallback for unmatched items |

## How to Replace an Image

1. Prepare your new image (JPG or PNG, recommended 600x400px or larger)
2. Name the file exactly as shown above (e.g. biryani.png)
3. Drop it into this folder, replacing the old one
4. Reload the menu page - the new image appears automatically (no code changes needed!)

## Adding a New Food Type

1. Add your image file here (e.g. pizza.png)
2. Open menu.html, find the FOOD_IMAGE_MAP array in the script section
3. Add: { keys: ['pizza'], img: 'pizza.png' }
