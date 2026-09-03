import WidgetKit
import SwiftUI
import OSLog

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

  static func downscale(_ image: UIImage, maxDimension: CGFloat) -> UIImage {
    let size = image.size
    let scale = min(maxDimension / size.width, maxDimension / size.height, 1.0)
    if scale >= 1.0 { return image }
    let newSize = CGSize(width: size.width * scale, height: size.height * scale)
    let format = UIGraphicsImageRendererFormat()
    format.scale = 1.0
    let renderer = UIGraphicsImageRenderer(size: newSize, format: format)
    return renderer.image { _ in
      image.draw(in: CGRect(origin: .zero, size: newSize))
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
        let rawImage = data.flatMap { UIImage(data: $0) }
        let image = rawImage.flatMap { Self.downscale($0, maxDimension: 700) } ?? UIImage(named: "bg_default")
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

  @Environment(\.widgetFamily) private var family

  var body: some View {
    GeometryReader { geometry in
      ZStack(alignment: .topLeading) {
        backgroundView(size: geometry.size)

        Color.black.opacity(0.35)

        contentView
          .frame(
            width: geometry.size.width,
            height: geometry.size.height,
            alignment: .topLeading
          )
      }
      .frame(
        width: geometry.size.width,
        height: geometry.size.height
      )
      .clipped()
    }
    .containerBackground(for: .widget) {
      Color.black
    }
  }

  @ViewBuilder
  private func backgroundView(size: CGSize) -> some View {
    if let backgroundImage = entry.backgroundImage {
      Image(uiImage: backgroundImage)
        .resizable()
        .scaledToFill()
        .frame(width: size.width, height: size.height)
        .clipped()
    } else {
      Color.black
        .frame(width: size.width, height: size.height)
    }
  }

  @ViewBuilder
  private var contentView: some View {
    switch family {
    case .systemSmall:
      smallView

    case .systemMedium:
      mediumView

    case .systemLarge:
      largeView

    default:
      smallView
    }
  }

  private var smallView: some View {
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
    .foregroundStyle(.white)
  }

  private var mediumView: some View {
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
    .padding()
    .foregroundStyle(.white)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }

  private var largeView: some View {
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
    .foregroundStyle(.white)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
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