import 'package:flutter/material.dart';

class RequestStandInPage extends StatelessWidget {
  const RequestStandInPage({super.key});

  static const Map<String, List<String>> _categoryOptions = {
    'Baby (0–3)': [
      "I am requesting a guest/stand-in for my child's:",
      'Playdate',
      'Library trip',
      'Zoo trip',
      'Baby dedication',
      'Baby shower',
      '1st Birthday party',
      '2nd Birthday party',
      '3rd Birthday party',
    ],
    'Young Child (3–10)': [
      'Field trip stand-in',
      'Award ceremony',
      'Parent/teacher conference',
      'Birthday party',
      'Art/Science fair stand-in',
      'Library trip',
      'Special education meeting',
    ],
    'Older Child (11–17)': [
      'School meeting',
      'Special education meeting',
      'Band/Dance/Theatre performance',
      'Sports event',
      'College tours',
    ],
    'Office': [
      'Team meeting representation',
      'Presentation attendee',
      'Client meeting support',
      'Interview stand-in',
    ],
    'Housing': [
      'Apartment tour',
      'Home inspection walk-through',
      'HOA or co-op meeting',
      'Repair/maintenance appointment',
    ],
    'Legal': [
      'Court appearance support',
      'Attorney consultation',
      'Mediation session',
      'Contract signing witness',
    ],
    'Hospital/Clinic': [
      'Medical appointment advocate',
      'Surgery waiting support',
      'Prenatal visit support',
      'Therapy session companion',
    ],
    'Errands': [
      'Grocery pickup',
      'Pharmacy pickup',
      'Appointment check-in',
      'Package/mail drop-off',
    ],
    'Retail': [
      'In-store pickup',
      'Product return/exchange',
      'Fitting room assistance',
      'Gift shopping',
    ],
    'Religious': [
      'Service attendance',
      'Prayer circle support',
      'Religious class/meeting',
      'Community outreach event',
    ],
    'Family': [
      'Family function stand-in',
      'Holiday gathering support',
      'Family meeting mediator',
      'Milestone celebration guest',
    ],
    'Outdoors/Camping': [
      'Camping trip buddy',
      'Hiking companion',
      'Outdoor event chaperone',
      'Park/playground supervision',
    ],
    'College': [
      'Campus tour companion',
      'Parent orientation stand-in',
      'Financial aid meeting',
      'Dorm move-in support',
    ],
    'Fitness': [
      'Gym buddy',
      'Yoga/pilates partner',
      'Dance class partner',
      'Race/event support',
    ],
    'Business/Work': [
      'Conference attendee',
      'Networking event companion',
      'Workshop participant',
      'Business travel companion',
    ],
    'Events': [
      'Wedding guest',
      'Birthday celebration',
      'Graduation ceremony',
      'Community event helper',
    ],
    'Memorial/Funeral': [
      'Funeral attendee',
      'Memorial service support',
      'Celebration of life helper',
      'Grief support visit',
    ],
    'Pets': [
      'Vet appointment helper',
      'Dog walk/playdate',
      'Pet sitting check-in',
      'Adoption event partner',
    ],
    'Food': [
      'Meal drop-off',
      'Grocery run support',
      'Food pantry pickup',
      'Meal prep assistance',
    ],
    'Travel': [
      'Airport pickup/drop-off',
      'Hotel check-in support',
      'Travel companion',
      'Appointment escort',
    ],
    'Other': [
      'Describe your request in the next step.',
    ],
  };

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final categories = _categoryOptions.keys.toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Request a Stand-In'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Choose a category',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Let us know what kind of support you need. Select a category to see common requests or add your own.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
            ),
            const SizedBox(height: 24),
            Expanded(
              child: GridView.builder(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 1.35,
                ),
                itemCount: categories.length,
                itemBuilder: (context, index) {
                  final category = categories[index];
                  return _CategoryTile(
                    label: category,
                    onTap: () => _showCategoryOptions(context, category),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCategoryOptions(BuildContext context, String category) {
    final options = _categoryOptions[category] ?? const [];
    final isOther = category == 'Other';

    if (isOther) {
      _showRequestForm(context, category, null);
      return;
    }

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          expand: false,
          builder: (context, scrollController) {
            return Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade400,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    category,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 16),
                  Expanded(
                    child: ListView.builder(
                      controller: scrollController,
                      itemCount: options.length,
                      itemBuilder: (context, index) {
                        final option = options[index];
                        return Card(
                          margin: const EdgeInsets.symmetric(vertical: 8),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: ListTile(
                            title: Text(option),
                            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                            onTap: () {
                              Navigator.of(context).pop();
                              _showRequestForm(context, category, option);
                            },
                          ),
                        );
                      },
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.of(context).pop();
                      _showRequestForm(context, category, null);
                    },
                    child: const Text('Need something else? Add your own request'),
                  ),
                const SizedBox(height: 8),
              ],
            ),
          );
          },
        );
      },
    );
  }

  void _showRequestForm(
    BuildContext context,
    String category,
    String? prefill,
  ) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        final controller = TextEditingController(text: prefill);
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Request details',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Category: $category',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: controller,
                maxLines: 4,
                decoration: const InputDecoration(
                  labelText: 'Tell us what you need',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          'Request started for "$category"'
                          '${prefill != null ? ' • $prefill' : ''}',
                        ),
                      ),
                    );
                  },
                  child: const Text('Continue to request form'),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
  }
}

class _CategoryTile extends StatelessWidget {
  const _CategoryTile({
    required this.label,
    required this.onTap,
  });

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Material(
      color: colorScheme.primaryContainer.withOpacity(0.4),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Center(
            child: Text(
              label,
              textAlign: TextAlign.center,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
                color: colorScheme.onPrimaryContainer,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
