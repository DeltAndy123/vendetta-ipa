import plistlib
import shutil
import zipfile
print('Opening IPA')
with zipfile.ZipFile("discord.ipa", "r") as stock_ipa:
    print('Extracting to workspace/vendetta')
    stock_ipa.extractall("workspace/vendetta")

print('Adding custom app icon')
shutil.copy('icons/VendettaIcon60x60@2x.png',
            'workspace/vendetta/Payload/Discord.app/VendettaIcon60x60@2x.png')
shutil.copy('icons/VendettaIcon76x76@2x~ipad.png',
            'workspace/vendetta/Payload/Discord.app/VendettaIcon76x76@2x~ipad.png')

print('Opening Info.plist')
with open('workspace/vendetta/Payload/Discord.app/Info.plist', 'rb') as info_plist:
    parsed_plist = plistlib.load(info_plist)

    print('Renaming app')
    parsed_plist['CFBundleName'] = 'Vendetta'
    parsed_plist['CFBundleDisplayName'] = 'Vendetta'

    print('Switching app icons')
    parsed_plist['CFBundleIcons']['CFBundlePrimaryIcon']['CFBundleIconName'] = 'VendettaIcon'
    parsed_plist['CFBundleIcons']['CFBundlePrimaryIcon']['CFBundleIconFiles'] = [
        'VendettaIcon60x60']
    parsed_plist['CFBundleIcons~ipad']['CFBundlePrimaryIcon']['CFBundleIconName'] = 'VendettaIcon'
    parsed_plist['CFBundleIcons~ipad']['CFBundlePrimaryIcon']['CFBundleIconFiles'] = [
        'VendettaIcon60x60', 'VendettaIcon72x72']

    print('Enabling documents folder in Files and iTunes')
    parsed_plist['UISupportsDocumentBrowser'] = True
    parsed_plist['UIFileSharingEnabled'] = True

    print('Saving Info.plist')
    with open('workspace/vendetta/Payload/Discord.app/Info.plist', 'wb') as info_plist:
        plistlib.dump(parsed_plist, info_plist)

print('Creating IPA')
shutil.make_archive('workspace/Vendetta', 'zip', 'workspace/vendetta')
shutil.move('workspace/Vendetta.zip', 'renamed.ipa')
