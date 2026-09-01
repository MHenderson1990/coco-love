import WidgetKit
import SwiftUI

struct AffirmationEntry: TimelineEntry {
  let date: Date
  let text: String
  let streak: Int
  let isPinned: Bool
}

struct Provider: TimelineProvider {
  let suiteName = "group.com.coco.houseoflove"

  func placeholder(in context: Context) -> AffirmationEntry {
    AffirmationEntry(date: Date(), text: "Your peace is a priority, not a luxury.", streak: 0, isPinned: false)
  }

  func getSnapshot(in context: Context, completion: @escaping (AffirmationEntry) -> Void) {
    completion(loadEntry())
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<AffirmationEntry>) -> Void) {
    let entry = loadEntry()
    // refresh once a day at minimum; app will also force a reload when data changes
    let nextUpdate = Calendar.current.date(byAdding: .hour, value: 6, to: Date())!
    completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
  }

  func loadEntry() -> AffirmationEntry {
    let defaults = UserDefaults(suiteName: suiteName)
    let text = defaults?.string(forKey: "widgetAffirmationText") ?? "Your peace is a priority, not a luxury."
    let streak = defaults?.integer(forKey: "widgetStreak") ?? 0
    let isPinned = defaults?.bool(forKey: "widgetIsPinned") ?? false
    return AffirmationEntry(date: Date(), text: text, streak: streak, isPinned: isPinned)
  }
}

struct TodayWidgetEntryView: View {
  var entry: Provider.Entry
  @Environment(\.widgetFamily) var family

  var body: some View {
    switch family {
    case .systemSmall:
      smallView
    case .systemMedium:
      mediumView
    default:
      largeView
    }
  }

  var smallView: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text(entry.text)
        .font(.system(size: 13, weight: .medium))
        .lineLimit(5)
        .minimumScaleFactor(0.7)
      Spacer()
      if entry.isPinned {
        Text("PINNED")
          .font(.system(size: 9, weight: .bold))
          .opacity(0.5)
      }
    }
    .padding()
    .containerBackground(for: .widget) { Color.black }
    .foregroundColor(.white)
  }

  var mediumView: some View {
    HStack {
      VStack(alignment: .leading, spacing: 8) {
        Text(entry.text)
          .font(.system(size: 15, weight: .medium))
          .lineLimit(4)
          .minimumScaleFactor(0.7)
        Spacer()
        HStack {
          if entry.isPinned {
            Text("PINNED")
              .font(.system(size: 9, weight: .bold))
              .opacity(0.5)
          }
          Spacer()
          Text("\(entry.streak) day streak")
            .font(.system(size: 10, weight: .semibold))
            .opacity(0.6)
        }
      }
    }
    .padding()
    .containerBackground(for: .widget) { Color.black }
    .foregroundColor(.white)
  }

  var largeView: some View {
    VStack(alignment: .leading, spacing: 12) {
      Text("TODAY'S MESSAGE")
        .font(.system(size: 11, weight: .bold))
        .opacity(0.5)
      Text(entry.text)
        .font(.system(size: 20, weight: .medium))
        .lineLimit(8)
        .minimumScaleFactor(0.7)
      Spacer()
      HStack {
        if entry.isPinned {
          Text("PINNED")
            .font(.system(size: 10, weight: .bold))
            .opacity(0.5)
        }
        Spacer()
        Text("\(entry.streak) day streak")
          .font(.system(size: 12, weight: .semibold))
          .opacity(0.6)
      }
    }
    .padding()
    .containerBackground(for: .widget) { Color.black }
    .foregroundColor(.white)
  }
}

struct TodayWidget: Widget {
  let kind: String = "TodayWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Provider()) { entry in
      TodayWidgetEntryView(entry: entry)
    }
    .configurationDisplayName("Today's Message")
    .description("Shows today's affirmation, or a pinned favorite.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
  }
}