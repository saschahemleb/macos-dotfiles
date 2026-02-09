#!/usr/bin/env php
<?php

declare(strict_types=1);

// Close any open System Preferences panes, to prevent them from overriding
// settings we’re about to change
`osascript -e 'tell application "System Preferences" to quit'`;

foreach (my_defaults() as $defaults) {
    $defaults->apply();
}

foreach (['Dock', 'Finder', 'SystemUIServer', 'System Settings'] as $app) {
    `killall "$app" &> /dev/null`;
}

function my_defaults(): array {
    return [
        // Disable press-and-hold for keys in favor of key repeat
        new Defaults(domain: null, key: 'ApplePressAndHoldEnabled', value: false),
        // Use AirDrop over every interface. srsly this should be a default
        new Defaults(enable: false, domain: 'com.apple.NetworkBrowser', key: 'BrowseAllInterfaces', value: new Value('1')),
        // Always open everything in Finder's list view
        new Defaults(enable: false, domain: 'com.apple.Finder', key: 'FXPreferredViewStyle', value: new Value('Nlsv')),
        // Set a really fast key repeat
        new Defaults(enable: false, domain: 'NSGlobalDomain', key: 'KeyRepeat', value: 1),
        // Set the Finder prefs for showing a few different volumes on the Desktop
        new Defaults(enable: false, domain: 'com.apple.finder', key: 'ShowExternalHardDrivesOnDesktop', value: true),
        new Defaults(enable: false, domain: 'com.apple.finder', key: 'ShowRemovableMediaOnDesktop', value: true),
        // Run the screensaver if we're in the bottom-left hot corner
        new Defaults(enable: false, domain: 'com.apple.dock', key: 'wvous-bl-corner', value: 5),
        new Defaults(enable: false, domain: 'com.apple.dock', key: 'wvous-bl-modifier', value: 0),
        // Put the Dock on the left of the screen
        new Defaults(domain: 'com.apple.dock', key: 'orientation', value: 'left'),
        // Dock icon size to 128px
        new Defaults(domain: 'com.apple.dock', key: 'tilesize', value: 128),
        // Autohide the Dock when the mouse is out
        new Defaults(domain: 'com.apple.dock', key: 'autohide', value: true),
        // Reduce the Dock autohide animation to a minimum
        new Defaults(domain: 'com.apple.dock', key: 'autohide-time-modifier', value: 0.15),
        // Remove the autohide delay, the Dock appears instantly
        new Defaults(domain: 'com.apple.dock', key: 'autohide-delay', value: 0.00),
        // Do not display recent apps in the Dock
        new Defaults(domain: 'com.apple.dock', key: 'show-recents', value: false),
        new Defaults(enable: false, domain: 'com.apple.dock', key: 'mineffect', value: 'suck'),
        // Only show active apps
        new Defaults(domain: 'com.apple.dock', key: 'static-only', value: true),
        // Scroll up on a Dock icon to show all Space's opened windows for an app
        new Defaults(enable: false, domain: 'com.apple.dock', key: 'scroll-to-open', value: true),
        // Show all file extensions in the Finder.
        new Defaults(domain: null, key: 'AppleShowAllExtensions', value: true),
        // Show hidden files inside the Finder
        new Defaults(domain: 'com.apple.finder', key: 'AppleShowAllFiles', value: true),
        // Hide path bar
        new Defaults(domain: 'com.apple.finder', key: 'ShowPathbar', value: true),
        // Do not display a warning when changing a file extension
        new Defaults(domain: 'com.apple.finder', key: 'FXEnableExtensionChangeWarning', value: false),
        // Remove the delay when hovering the toolbar title
        new Defaults(domain: null, key: 'NSToolbarTitleViewRolloverDelay', value: 0.00),
        // Disable natural scrolling
        new Defaults(domain: null, key: 'com.apple.swipescrolldirection', value: false),
        // 'Auto' Appearance
        new Defaults(domain: null, key: 'AppleInterfaceStyleSwitchesAutomatically', value: true),
        // Show desktop only in stage manager on click
        new Defaults(domain: 'com.apple.WindowManager', key: 'EnableStandardClickToShowDesktop', value: false),
        // Always show Bluetooth in menu bar
        new Defaults(domain: 'com.apple.controlcenter', key: 'Bluetooth', value: 18),
        // Always show Bluetooth in menu bar
        new Defaults(domain: 'com.apple.controlcenter', key: 'Sound', value: 18),
        // Show battery percentage
        new Defaults(domain: 'com.apple.controlcenter', key: 'BatteryShowPercentage', value: true),
    ];
}

class Value {
    public function __construct(public readonly string $raw) {}
}

class Defaults {
    public function __construct(
        public readonly string|null $domain,
        public readonly string $key,
        public readonly Value|string|int|float|bool $value,
        private readonly bool $enable = true,
    ) {}

    public function apply(): void {
        if ($this->enable) {
            fwrite(STDERR, "Setting $this->domain:$this->key\n");
            $this->write();
        } else {
            fwrite(STDERR, "Deleting $this->domain:$this->key\n");
            $this->delete();
        }
    }

    private function write(): void {
        $domainOrDashG = $this->domain ?? '-g';
        $valueWithFlag = match (gettype($this->value)) {
            'object', $this->value instanceof Value => $this->value->raw,
            'string' => '-string ' . escapeshellarg($this->value),
            'integer' => '-integer ' . $this->value,
            'double' => '-float ' . $this->value,
            'boolean' => '-boolean ' . ($this->value ? 'true' : 'false'),
            default => throw new \RuntimeException(sprintf("Unknown type '%s'", gettype($this->value))),
        };

        `defaults write $domainOrDashG $this->key $valueWithFlag`;
    }

    private function delete(): void {
        $domainOrDashG = $this->domain ?? '-g';

        `defaults delete $domainOrDashG $this->key`;
    }
}