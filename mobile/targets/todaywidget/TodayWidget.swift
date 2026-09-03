import WidgetKit
import SwiftUI

struct AffirmationEntry: TimelineEntry {
  let date: Date
  let text: String
  let isPinned: Bool
  let backgroundImage: UIImage?
}

struct Provider: TimelineProvider {
  let suiteName = "group.com.coco.houseoflove"

  let presetImageNames: [String: String] = [
    "default": "bg_default",
    "woman": "bg_woman",
    "fall": "bg_fall",
    "stars": "bg_stars",
    "flowers": "bg_flowers",
  ]

  func placeholder(in context: Context) -> AffirmationEntry {
    AffirmationEntry(date: Date(), text: "Your peace is a priority, not a luxury.", isPinned: false, backgroundImage: UIImage(named: "bg_default"))
  }

  func getSnapshot(in context: Context, completion: @escaping (AffirmationEntry) -> Void) {
    loadEntry { entry in
      completion(entry)
    }
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<AffirmationEntry>) -> Void) {
    loadEntry { entry in
      let nextUpdate = Calendar.current.date(byAdding: .hour, value: 6, to: Date())!
      completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }
  }

  func loadEntry(completion: @escaping (AffirmationEntry) -> Void) {
    let defaults = UserDefaults(suiteName: suiteName)
    let text = defaults?.string(forKey: "widgetAffirmationText") ?? "Your peace is a priority, not a luxury."
    let isPinned = defaults?.bool(forKey: "widgetIsPinned") ?? false
    let backgroundPhoto = defaults?.string(forKey: "widgetBackgroundPhoto") ?? "default"

    if backgroundPhoto.hasPrefix("http") {
      guard let url = URL(string: backgroundPhoto) else {
        completion(AffirmationEntry(date: Date(), text: text, isPinned: isPinned, backgroundImage: UIImage(named: "bg_default")))
        return
      }
      URLSession.shared.dataTask(with: url) { data, _, _ in
        let image = data.flatMap { UIImage(data: $0) } ?? UIImage(named: "bg_default")
        completion(AffirmationEntry(date: Date(), text: text, isPinned: isPinned, backgroundImage: image))
      }.resume()
    } else {
      let assetName = presetImageNames[backgroundPhoto] ?? "bg_default"
      let image = UIImage(named: assetName) ?? UIImage(named: "bg_default")
      completion(AffirmationEntry(date: Date(), text: text, isPinned: isPinned, backgroundImage: image))
    }
  }
}

struct TodayWidgetEntryView: View {
  var entry: Provider.Entry
  @Environment(\.widgetFamily) var family

  var body: some View {
    ZStack {
      if let bg = entry.backgroundImage {
        Image(uiImage: bg)
          .resizable()
          .aspectRatio(contentMode: .fill)
      } else {
        Color.black
      }
      Color.black.opacity(0.35)

      switch family {
      case .systemSmall:
        smallView
      case .systemMedium:
        mediumView
      default:
        largeView
      }
    }
    .containerBackground(for: .widget) { Color.black }
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
          .opacity(0.7)
      }
    }
    .padding()
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
        if entry.isPinned {
          Text("PINNED")
            .font(.system(size: 9, weight: .bold))
            .opacity(0.7)
        }
      }
      Spacer()
    }
    .padding()
    .foregroundColor(.white)
  }

  var largeView: some View {
    VStack(alignment: .leading, spacing: 12) {
      Text("TODAY'S MESSAGE")
        .font(.system(size: 11, weight: .bold))
        .opacity(0.7)
      Text(entry.text)
        .font(.system(size: 20, weight: .medium))
        .lineLimit(8)
        .minimumScaleFactor(0.7)
      Spacer()
      if entry.isPinned {
        Text("PINNED")
          .font(.system(size: 10, weight: .bold))
          .opacity(0.7)
      }
    }
    .padding()
    .foregroundColor(.white)
  }
}

@main
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