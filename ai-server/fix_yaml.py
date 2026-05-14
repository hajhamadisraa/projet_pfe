import os

base = os.path.abspath('dataset').replace('\\', '/')

content = 'train: ' + base + '/train/images\n'
content += 'val: ' + base + '/valid/images\n'
content += 'test: ' + base + '/test/images\n'
content += 'nc: 2\n'
content += 'names: ["AbNormal", "Normal"]\n'

with open('dataset/data.yaml', 'w') as f:
    f.write(content)

print('data.yaml corrige !')
print(content)